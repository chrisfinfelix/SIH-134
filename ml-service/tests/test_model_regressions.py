"""Regression tests for model-level bugs found while integrating with the web app."""
from app.models.forecast_model import forecast_demand


def test_meta_options_lists_valid_inputs(client):
    r = client.get("/meta/options")
    assert r.status_code == 200
    body = r.json()
    assert body["roles"] and body["districts"] and body["courses"] and body["forecast_series"]
    first = body["forecast_series"][0]
    assert {"role_title", "skill", "location"} <= first.keys()


def test_multi_series_forecast_does_not_collapse():
    # A role spanning many series used to be forecast as one aggregate, which the
    # per-series-trained trees could not extrapolate to (156 observed -> 47 forecast).
    result = forecast_demand("Assembly Line Operator", None, None)
    last_observed = result["history"][-1]["openings"]
    next_forecast = result["forecast"][0]["predicted_openings"]
    assert next_forecast > 0.5 * last_observed


def test_forecast_includes_history(client):
    series = client.get("/meta/options").json()["forecast_series"][0]
    r = client.get(
        "/forecast/demand",
        params={"role": series["role_title"], "skill": series["skill"], "location": series["location"]},
    )
    body = r.json()
    assert body["history"], "chart needs observed history alongside the forecast"
    assert all(p["lower_bound"] <= p["predicted_openings"] <= p["upper_bound"] for p in body["forecast"])


def test_trend_growth_is_not_biased_by_window_length(client):
    # Growth used to compare a 1/3 window against a 2/3 window, pinning every topic near -50%.
    topics = client.get("/trend/emerging").json()["topics"]
    assert topics
    assert not all(-60 <= t["growth_pct"] <= -35 for t in topics)


def test_career_path_resolves_skill_variants(client):
    body = client.get("/career-path/node js").json()
    assert body["resolved_node"] == "Node.js"
    assert body["next_steps"]


def test_career_path_top_k(client):
    body = client.get("/career-path/Python", params={"top_k": 3}).json()
    assert len(body["next_steps"]) == 3
