"""
Fine-tunes distilbert-base-uncased as a multi-class sequence classifier onto
occupation codes, trained on synthetic title-variation pairs generated from
the occupation taxonomy (since we have no real labeled job-title dataset yet).

Saves the fine-tuned model + tokenizer + label_map.json to
training/checkpoints/job_title_classifier/, which app/models/job_title_model.py
picks up automatically on the next request (falling back to the zero-shot
bi-encoder path until this has been run).

CPU-only, small model, ~5 epochs over a small synthetic set -- meant to be
"lightly fine-tuned", per the build brief's Phase 4 constraint, not
state-of-the-art accuracy.

Usage:
    python training/train_job_title_classifier.py
"""
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.models.taxonomy_loader import load_occupations  # noqa: E402

random.seed(42)

MODEL_NAME = "distilbert-base-uncased"
OUT_DIR = ROOT / "training" / "checkpoints" / "job_title_classifier"

TITLE_TEMPLATES = [
    "{title}",
    "Senior {title}",
    "Junior {title}",
    "{title} needed",
    "Hiring {title}",
    "Lead {title}",
    "{title} - Full Time",
    "Experienced {title}",
    "Looking for {title}",
    "{title} (Remote)",
    "{title} Trainee",
    "Assistant {title}",
    "{title} - Contract",
    "Walk-in interview for {title}",
]


def build_dataset():
    occs = load_occupations()
    codes = [o["code"] for o in occs]
    label_map = {str(i): code for i, code in enumerate(codes)}
    code_to_label = {code: i for i, code in label_map.items()}

    texts, labels = [], []
    for occ in occs:
        for template in TITLE_TEMPLATES:
            texts.append(template.format(title=occ["title"]))
            labels.append(int(code_to_label[occ["code"]]))
    return texts, labels, label_map


def main():
    import numpy as np
    import torch
    from torch.utils.data import Dataset
    from transformers import (
        AutoModelForSequenceClassification,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
    )

    texts, labels, label_map = build_dataset()
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=len(label_map))

    encodings = tokenizer(texts, truncation=True, padding=True, max_length=32)

    class TitleDataset(Dataset):
        def __len__(self):
            return len(labels)

        def __getitem__(self, idx):
            item = {k: torch.tensor(v[idx]) for k, v in encodings.items()}
            item["labels"] = torch.tensor(labels[idx])
            return item

    dataset = TitleDataset()

    args = TrainingArguments(
        output_dir=str(OUT_DIR / "_train_tmp"),
        num_train_epochs=15,
        per_device_train_batch_size=16,
        learning_rate=5e-5,
        logging_steps=10,
        save_strategy="no",
        report_to=[],
        use_cpu=True,
    )

    trainer = Trainer(model=model, args=args, train_dataset=dataset)
    trainer.train()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(OUT_DIR)
    tokenizer.save_pretrained(OUT_DIR)
    with open(OUT_DIR / "label_map.json", "w", encoding="utf-8") as f:
        json.dump(label_map, f, indent=2)

    print(f"Fine-tuned job-title classifier saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
