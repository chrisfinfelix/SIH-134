import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pytest
from fastapi.testclient import TestClient

from app.data.synthetic.generate_all import generate_and_save_all
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def ensure_synthetic_data():
    generate_and_save_all()


@pytest.fixture(scope="session")
def client():
    return TestClient(app)
