from typing import List, Callable
from datetime import datetime, timedelta
import uuid

# Import advanced rules
from .advanced_rules import ADVANCED_RULES


def _ensure_sorted_events(events: List[dict]) -> List[dict]:
    """Ensure timestamps are datetimes and events are sorted by timestamp.

    This is defensive: any unexpected timestamp shape (None, bad string,
    other types) is normalized to a current UTC datetime so sorting cannot
    raise TypeError.
    """
    evs: List[dict] = []
    for e in events:
        ts = e.get('timestamp')
        safe_ts: datetime
        if isinstance(ts, datetime):
            safe_ts = ts
        elif isinstance(ts, str):
            # Support both plain ISO strings and ones with a trailing 'Z'.
            text = ts.replace('Z', '+00:00')
            try:
                safe_ts = datetime.fromisoformat(text)
            except Exception:
                safe_ts = datetime.utcnow()
        else:
            # None or any other unexpected type
            safe_ts = datetime.utcnow()
        e['timestamp'] = safe_ts
        evs.append(e)
    evs.sort(key=lambda x: x['timestamp'])
    return evs


def _take_evidence(events: List[dict], max_items: int = 5) -> List[str]:
    # Build compact evidence strings: timestamp + type + (event_id)
    out = []
    for e in events[:max_items]:
        ts = e.get('timestamp')
        ts_s = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
        eid = e.get('event_id') or ''
        ev_type = e.get('type') or ''
        out.append(f"{ts_s} | {ev_type} | {eid}")
    return out


def high_context_switch_rule(events: List[dict], window_minutes: int = 10, threshold: int = 12):
    evs = _ensure_sorted_events(events)
    now = datetime.utcnow()
    window = now - timedelta(minutes=window_minutes)
    # count focus/app_switch events in window
    switches = [e for e in evs if e.get('type') in ('window_focus', 'app_switch') and e.get('timestamp') and e['timestamp'] >= window]
    count = len(switches)
    if count > threshold:
        confidence = min(0.99, float(count) / float(max(1, threshold * 1.5)))
        suggestion = {
            'id': str(uuid.uuid4()),
            'title': 'High context switching',
            'description': f'You switched focus {count} times in the last {window_minutes} minutes.',
            'severity': 'medium' if count < threshold * 2 else 'high',
            'confidence': confidence,
            'evidence': _take_evidence(list(reversed(switches))),
            'suggested_action': 'Try batching similar tasks or schedule a focused time block.'
        }
        return [suggestion]
    return []


def short_burst_interruptions_rule(events: List[dict], session_cutoff_minutes: int = 5, bursts_threshold: int = 6):
    evs = _ensure_sorted_events(events)
    # Build sessions by gaps
    sessions = []
    if not evs:
        return []
    session_start = evs[0]['timestamp']
    session_end = evs[0]['timestamp']
    for e in evs[1:]:
        t = e['timestamp']
        gap_min = (t - session_end).total_seconds() / 60.0
        if gap_min > session_cutoff_minutes:
            sessions.append((session_start, session_end))
            session_start = t
            session_end = t
        else:
            session_end = t
    sessions.append((session_start, session_end))

    durations = [((s[1] - s[0]).total_seconds() / 60.0) for s in sessions]
    short_sessions = [d for d in durations if d < session_cutoff_minutes]
    if len(short_sessions) >= bursts_threshold:
        confidence = min(0.95, float(len(short_sessions)) / float(bursts_threshold * 1.2))
        # evidence: sample events from short sessions
        evidence_events = []
        for s in sessions:
            # take first event in each short session
            if (s[1] - s[0]).total_seconds() / 60.0 < session_cutoff_minutes:
                # find events in that window
                for e in evs:
                    if s[0] <= e['timestamp'] <= s[1]:
                        evidence_events.append(e)
                        break
        suggestion = {
            'id': str(uuid.uuid4()),
            'title': 'Frequent short interruptions',
            'description': f'Found {len(short_sessions)} short active bursts (<{session_cutoff_minutes}m). Consider scheduling uninterrupted focus time.',
            'severity': 'medium',
            'confidence': confidence,
            'evidence': _take_evidence(evidence_events),
            'suggested_action': 'Try a 25-50 minute focus session (Pomodoro) and silence notifications.'
        }
        return [suggestion]
    return []


def repeated_sequence_rule(events: List[dict], min_repeat: int = 3, seq_len: int = 3):
    evs = _ensure_sorted_events(events)
    types = [e.get('type') for e in evs if e.get('type')]
    if len(types) < seq_len * min_repeat:
        return []
    counts = {}
    positions = {}
    for i in range(0, len(types) - seq_len + 1):
        seq = tuple(types[i:i + seq_len])
        counts[seq] = counts.get(seq, 0) + 1
        positions.setdefault(seq, []).append(i)
    repeats = [(seq, c) for seq, c in counts.items() if c >= min_repeat]
    if repeats:
        seq, c = repeats[0]
        # pick evidence from first few positions
        evidence_events = []
        for pos in positions.get(seq, [])[:min_repeat]:
            # map back to events
            ev = evs[pos]
            evidence_events.append(ev)
        suggestion = {
            'id': str(uuid.uuid4()),
            'title': 'Repeated manual sequence',
            'description': f'The sequence {seq} repeated {c} times — you could automate this workflow.',
            'severity': 'low',
            'confidence': min(0.9, float(c) / float(min_repeat)),
            'evidence': _take_evidence(evidence_events),
            'suggested_action': 'Record a macro or create a script to automate this sequence.'
        }
        return [suggestion]
    return []


# list of rule functions
ALL_RULES: List[Callable] = [high_context_switch_rule, short_burst_interruptions_rule, repeated_sequence_rule] + ADVANCED_RULES


def run_rules_and_score(events: List[dict], rules: List[Callable]):
    suggestions = []
    evs = _ensure_sorted_events(events)
    for rule in rules:
        try:
            res = rule(evs)
            for s in res:
                suggestions.append(s)
        except Exception:
            # skip rule if it fails
            continue
    severity_map = {'low': 1, 'medium': 2, 'high': 3}
    for s in suggestions:
        # ensure confidence is in 0..1
        conf = max(0.0, min(1.0, float(s.get('confidence', 0.0))))
        base = severity_map.get(s.get('severity', 'low'), 1)
        # allow confidence to shift score; tuned weights
        s['score'] = base * 0.6 + conf * 0.4
    suggestions.sort(key=lambda x: x.get('score', 0), reverse=True)
    return suggestions
