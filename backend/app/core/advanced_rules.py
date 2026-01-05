"""
Advanced rule implementations for sophisticated pattern detection
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import uuid
from collections import defaultdict, deque
import statistics

from .ml_models import ml_engine


def deep_work_pattern_rule(events: List[Dict], min_duration_minutes: int = 45, max_interruptions: int = 2):
    """Detect deep work sessions vs fragmented work"""
    evs = _ensure_sorted_events(events)
    
    if len(evs) < 10:
        return []
    
    # Find continuous work sessions
    sessions = []
    current_session = []
    last_event_time = None
    
    for event in evs:
        event_time = event.get('timestamp')
        if not event_time:
            continue
            
        if isinstance(event_time, str):
            event_time = datetime.fromisoformat(event_time.replace('Z', '+00:00'))
        
        # Check if this is a continuation (within 5 minutes)
        if last_event_time and (event_time - last_event_time).total_seconds() > 300:
            # Session break
            if current_session:
                sessions.append(current_session)
            current_session = [event]
        else:
            current_session.append(event)
        
        last_event_time = event_time
    
    if current_session:
        sessions.append(current_session)
    
    # Analyze each session
    deep_work_sessions = []
    for session in sessions:
        if len(session) < 5:
            continue
            
        session_start = session[0].get('timestamp')
        session_end = session[-1].get('timestamp')
        
        if isinstance(session_start, str):
            session_start = datetime.fromisoformat(session_start.replace('Z', '+00:00'))
        if isinstance(session_end, str):
            session_end = datetime.fromisoformat(session_end.replace('Z', '+00:00'))
        
        duration_minutes = (session_end - session_start).total_seconds() / 60
        
        if duration_minutes >= min_duration_minutes:
            # Count interruptions in this session
            interruptions = sum(1 for e in session if e.get('type') in ['notification', 'app_switch'])
            
            if interruptions <= max_interruptions:
                deep_work_sessions.append({
                    'start': session_start,
                    'end': session_end,
                    'duration': duration_minutes,
                    'interruptions': interruptions,
                    'events': session
                })
    
    if deep_work_sessions:
        # Calculate total deep work time
        total_deep_time = sum(s['duration'] for s in deep_work_sessions)
        confidence = min(0.95, total_deep_time / (len(evs) * 0.1))  # Normalize by total events
        
        suggestion = {
            'id': str(uuid.uuid4()),
            'title': 'Deep work pattern detected',
            'description': f'You had {len(deep_work_sessions)} deep work sessions totaling {total_deep_time:.0f} minutes with minimal interruptions.',
            'severity': 'low' if total_deep_time > 120 else 'medium',
            'confidence': confidence,
            'evidence': [f"Session {i+1}: {s['duration']:.0f}min, {s['interruptions']} interruptions" 
                        for i, s in enumerate(deep_work_sessions[:3])],
            'suggested_action': 'Maintain this deep work pattern. Consider scheduling more focused sessions.'
        }
        return [suggestion]
    
    return []


def productivity_rhythm_rule(events: List[Dict], window_hours: int = 4):
    """Detect productivity rhythms and optimal work times"""
    evs = _ensure_sorted_events(events)
    
    if len(evs) < 20:
        return []
    
    # Group events by hour of day
    hourly_productivity = defaultdict(list)
    
    for event in evs:
        timestamp = event.get('timestamp')
        if not timestamp:
            continue
            
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        hour = timestamp.hour
        # Simple productivity metric: focus events vs interruptions
        productivity_score = 1.0 if event.get('type') in ['window_focus', 'key_press', 'mouse_move'] else 0.0
        hourly_productivity[hour].append(productivity_score)
    
    # Calculate average productivity per hour
    hourly_avg = {}
    for hour, scores in hourly_productivity.items():
        if len(scores) >= 3:  # Need minimum data points
            hourly_avg[hour] = statistics.mean(scores)
    
    if len(hourly_avg) < 3:
        return []
    
    # Find peak productivity hours
    peak_hours = sorted(hourly_avg.items(), key=lambda x: x[1], reverse=True)[:3]
    low_hours = sorted(hourly_avg.items(), key=lambda x: x[1])[:3]
    
    # Calculate consistency
    productivity_values = list(hourly_avg.values())
    consistency = 1.0 - (statistics.stdev(productivity_values) if len(productivity_values) > 1 else 0)
    
    if consistency > 0.7:  # Has clear rhythm
        suggestion = {
            'id': str(uuid.uuid4()),
            'title': 'Productivity rhythm identified',
            'description': f'Your productivity peaks around {peak_hours[0][0]}:00-{peak_hours[0][0]+1}:00 with {peak_hours[0][1]:.1%} average focus.',
            'severity': 'low',
            'confidence': consistency,
            'evidence': [f"Peak: {h}:00 ({p:.1%})" for h, p in peak_hours] + 
                       [f"Low: {h}:00 ({p:.1%})" for h, p in low_hours],
            'suggested_action': f'Schedule important work during {peak_hours[0][0]}:00-{peak_hours[0][0]+2}:00 for optimal productivity.'
        }
        return [suggestion]
    
    return []


def burnout_risk_rule(events: List[Dict], days_to_analyze: int = 7):
    """Detect potential burnout risk from work patterns"""
    evs = _ensure_sorted_events(events)
    
    if len(evs) < 50:
        return []
    
    # Analyze work patterns over recent days
    now = datetime.utcnow()
    daily_patterns = defaultdict(lambda: {'work_events': 0, 'interruptions': 0, 'start_time': None, 'end_time': None})
    
    for event in evs:
        timestamp = event.get('timestamp')
        if not timestamp:
            continue
            
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # Only analyze last N days
        if (now - timestamp).days > days_to_analyze:
            continue
        
        day_key = timestamp.date()
        
        # Track work events
        if event.get('type') in ['window_focus', 'key_press', 'mouse_move']:
            daily_patterns[day_key]['work_events'] += 1
            
            # Track work hours
            if daily_patterns[day_key]['start_time'] is None:
                daily_patterns[day_key]['start_time'] = timestamp.time()
            daily_patterns[day_key]['end_time'] = timestamp.time()
        
        # Track interruptions
        if event.get('type') in ['notification', 'app_switch']:
            daily_patterns[day_key]['interruptions'] += 1
    
    # Calculate burnout risk factors
    risk_factors = []
    avg_work_hours = 0
    high_intensity_days = 0
    
    for day_data in daily_patterns.values():
        work_events = day_data['work_events']
        interruptions = day_data['interruptions']
        
        # High work intensity (many events)
        if work_events > 100:
            high_intensity_days += 1
        
        # High interruption rate
        if work_events > 0 and interruptions / work_events > 0.3:
            risk_factors.append('high_interruption_rate')
        
        # Calculate work hours
        if day_data['start_time'] and day_data['end_time']:
            start = datetime.combine(datetime.min.date(), day_data['start_time'])
            end = datetime.combine(datetime.min.date(), day_data['end_time'])
            work_hours = (end - start).total_seconds() / 3600
            avg_work_hours += work_hours
            
            # Long work days
            if work_hours > 10:
                risk_factors.append('long_work_hours')
    
    if len(daily_patterns) > 0:
        avg_work_hours /= len(daily_patterns)
    
    # Calculate burnout risk
    burnout_score = 0
    if avg_work_hours > 9:
        burnout_score += 0.3
    if high_intensity_days / len(daily_patterns) > 0.6:
        burnout_score += 0.4
    if len(set(risk_factors)) >= 2:
        burnout_score += 0.3
    
    if burnout_score > 0.6:
        suggestion = {
            'id': str(uuid.uuid4()),
            'title': 'High burnout risk detected',
            'description': f'Your work patterns show {len(risk_factors)} risk factors. Average work day: {avg_work_hours:.1f} hours.',
            'severity': 'high',
            'confidence': burnout_score,
            'evidence': [f"Risk factors: {', '.join(risk_factors)}", 
                       f"High intensity days: {high_intensity_days}/{len(daily_patterns)}"],
            'suggested_action': 'Consider taking breaks, reducing work hours, or practicing stress management techniques.'
        }
        return [suggestion]
    
    return []


def ml_enhanced_rule(events: List[Dict]):
    """Use ML models to detect complex patterns"""
    if not ml_engine.initialize():
        return []
    
    analysis = ml_engine.analyze_patterns(events)
    
    suggestions = []
    
    # Productivity-based suggestions
    productivity = analysis.get('productivity', {})
    prediction = productivity.get('prediction', 'unknown')
    confidence = productivity.get('confidence', 0.0)
    
    if confidence > 0.7:
        if prediction == 'distracted':
            suggestions.append({
                'id': str(uuid.uuid4()),
                'title': 'ML-detected distraction pattern',
                'description': f'Machine learning analysis indicates distracted work patterns with {confidence:.1%} confidence.',
                'severity': 'medium',
                'confidence': confidence,
                'evidence': ['ML model classification based on event patterns'],
                'suggested_action': 'Try minimizing distractions and using focus techniques.'
            })
        elif prediction == 'focused':
            suggestions.append({
                'id': str(uuid.uuid4()),
                'title': 'ML-detected focused work',
                'description': f'Machine learning analysis indicates strong focus with {confidence:.1%} confidence.',
                'severity': 'low',
                'confidence': confidence,
                'evidence': ['ML model classification based on event patterns'],
                'suggested_action': 'Maintain this focused work pattern.'
            })
    
    # Anomaly-based suggestions
    anomaly = analysis.get('anomaly', {})
    if anomaly.get('is_anomaly', False):
        suggestions.append({
            'id': str(uuid.uuid4()),
            'title': 'Unusual work pattern detected',
            'description': f'Anomaly detection identified unusual behavior: {anomaly.get("reason", "unknown")}',
            'severity': 'medium',
            'confidence': anomaly.get('score', 0.0),
            'evidence': [f"Anomaly score: {anomaly.get('score', 0):.2f}"],
            'suggested_action': 'Review what changed in your work routine today.'
        })
    
    return suggestions


def _ensure_sorted_events(events: List[dict]) -> List[dict]:
    """Ensure timestamps are datetimes and events are sorted by timestamp"""
    evs = []
    for e in events:
        ts = e.get('timestamp')
        if isinstance(ts, str):
            try:
                e['timestamp'] = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            except Exception:
                e['timestamp'] = datetime.utcnow()
        elif ts is None:
            e['timestamp'] = datetime.utcnow()
        evs.append(e)
    evs.sort(key=lambda x: x.get('timestamp'))
    return evs


# List of advanced rules
ADVANCED_RULES = [
    deep_work_pattern_rule,
    productivity_rhythm_rule,
    burnout_risk_rule,
    ml_enhanced_rule,
]
