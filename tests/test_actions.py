from backend.app.core.actions import action_store
from backend.app.models import Action
from datetime import datetime


def test_add_and_get_action():
    user_id = 'user-123'
    a = Action(user_id=user_id, suggestion_id='s1', action='accept')
    # use model_dump for Pydantic v2 compatibility
    action_store.add_action(user_id, a.model_dump())
    actions = action_store.get_actions(user_id)
    assert isinstance(actions, list)
    assert len(actions) >= 1
    assert actions[-1]['suggestion_id'] == 's1'
