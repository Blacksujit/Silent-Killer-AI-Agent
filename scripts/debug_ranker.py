from datetime import datetime, timedelta
from backend.app.core.ranker import rank_suggestions
from backend.app.core.actions import action_store


def make_evidence(ts, etype, eid):
    return f"{ts.isoformat()} | {etype} | {eid}"

now = datetime.utcnow()
# suggestion A: high severity but old evidence
sA = {
    'id': 'sA',
    'title': 'Old high severity',
    'severity': 'high',
    'confidence': 0.9,
    'evidence': [make_evidence(now - timedelta(hours=5), 'window_focus', 'e1')]
}
# suggestion B: medium severity, recent evidence
sB = {
    'id': 'sB',
    'title': 'Recent accepted',
    'severity': 'medium',
    'confidence': 0.7,
    'evidence': [make_evidence(now - timedelta(minutes=1), 'window_focus', 'e2')]
}
user_id = 'u-test-ranker'
# add accept action for sB
action_store.add_action(user_id, {'user_id': user_id, 'suggestion_id': 'sB', 'action': 'accept', 'timestamp': now.isoformat()})

ranked = rank_suggestions([sA, sB], user_id)
print('Ranked IDs:', [r['id'] for r in ranked])
for r in ranked:
    print(r['id'], 'score=', r.get('_rank_score'))
