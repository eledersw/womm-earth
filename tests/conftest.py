import pytest

import _engine.power as power


@pytest.fixture(autouse=True)
def _fresh_power_cache():
    """Each test starts with an empty NASA box cache."""
    power.clear_cache()
    yield
    power.clear_cache()
