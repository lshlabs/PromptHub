import os

from .settings_base import *  # noqa

# Safety-first default:
# - config.settings now inherits secure/base behavior by default.
# - Development overrides are opt-in via DJANGO_USE_DEV_SETTINGS=true.
if os.getenv("DJANGO_USE_DEV_SETTINGS", "").strip().lower() in {"1", "true", "yes", "on"}:
    from .settings_dev import *  # noqa
