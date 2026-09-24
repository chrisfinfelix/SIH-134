"""Trains and saves the LGBMRanker curriculum-recommendation model.

Usage:
    python training/train_curriculum_ranker.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.curriculum_model import train  # noqa: E402

if __name__ == "__main__":
    booster = train()
    if booster is None:
        print("Not enough synthetic data to train -- run app/data/synthetic/generate_all.py first.")
    else:
        print("Curriculum ranker trained and saved to training/checkpoints/curriculum_ranker.txt")
