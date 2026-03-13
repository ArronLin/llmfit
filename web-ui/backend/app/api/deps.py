from typing import Generator

from fastapi import Depends


def get_db() -> Generator:
    """
    Dependency for database session.
    To be implemented when database is added.
    """
    try:
        # db = SessionLocal()
        # yield db
        yield None
    finally:
        # db.close()
        pass


def get_current_user():
    """
    Dependency for current authenticated user.
    To be implemented when auth is added.
    """
    pass
