'''WSGI entry point for cPanel/Phusion Passenger.'''

from a2wsgi import ASGIMiddleware

from backend.main import app, init_db


# ASGI lifespan events are unavailable behind WSGI, so perform the existing
# startup initialization when Passenger loads this process.
init_db()

application = ASGIMiddleware(app)
