"""Trains and saves the weak-labeled LightGBM oversupply classifier.

Usage:
    python training/train_oversupply_model.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.oversupply_model import train  # noqa: E402

if __name__ == "__main__":
    booster, feature_table = train()
    if booster is None:
        print("Not enough weak-label signal to train -- run app/data/synthetic/generate_all.py first.")
    else:
        n_pos = int(feature_table["weak_label"].sum())
        print(f"Oversupply model trained on {len(feature_table)} courses ({n_pos} weak-positive) "
              f"and saved to training/checkpoints/oversupply_lgbm.txt")
