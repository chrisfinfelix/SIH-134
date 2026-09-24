"""
Career pathway recommender: builds a skill/role graph from the taxonomy
(skill <-> skill edges when they co-occur as an occupation's typical_skills;
skill <-> role edges for "leads_to_role") and runs personalized PageRank
seeded at the query node to rank next-step suggestions.
"""
import logging
from functools import lru_cache
from itertools import combinations

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _build_graph():
    import networkx as nx

    from app.models.taxonomy_loader import load_occupations

    g = nx.Graph()
    occs = load_occupations()

    for occ in occs:
        role_node = occ["title"]
        g.add_node(role_node, node_type="role")
        for skill in occ["typical_skills"]:
            g.add_node(skill, node_type="skill")
            g.add_edge(skill, role_node, relation="leads_to_role", weight=1.0)

        for skill_a, skill_b in combinations(occ["typical_skills"], 2):
            if g.has_edge(skill_a, skill_b):
                g[skill_a][skill_b]["weight"] += 1.0
            else:
                g.add_edge(skill_a, skill_b, relation="commonly_paired_skill", weight=1.0)

    return g


def get_career_path(skill_or_role: str, top_k: int = 5) -> dict:
    g = _build_graph()

    matched_node = None
    for node in g.nodes:
        if node.strip().lower() == skill_or_role.strip().lower():
            matched_node = node
            break

    if matched_node is None:
        # Fall back to the bi-encoder so variants like "node js" resolve to "Node.js"
        from app.models.skill_standardizer import standardize_skill

        resolved = standardize_skill(skill_or_role)
        if resolved["status"] == "matched" and resolved["canonical_skill"] in g:
            matched_node = resolved["canonical_skill"]
        else:
            return {"query": skill_or_role, "resolved_node": None, "next_steps": []}

    import networkx as nx

    try:
        personalization = {n: (1.0 if n == matched_node else 0.0) for n in g.nodes}
        scores = nx.pagerank(g, personalization=personalization, weight="weight")
    except Exception as e:
        logger.warning("PageRank failed, falling back to degree centrality: %s", e)
        scores = nx.degree_centrality(g)

    neighbors = list(g.neighbors(matched_node))
    ranked = sorted(neighbors, key=lambda n: scores.get(n, 0.0), reverse=True)[:top_k]

    next_steps = []
    for n in ranked:
        edge_data = g.get_edge_data(matched_node, n) or {}
        next_steps.append(
            {
                "node": n,
                "node_type": g.nodes[n].get("node_type", "skill"),
                "pagerank_score": round(float(scores.get(n, 0.0)), 5),
                "relation": edge_data.get("relation", "related"),
            }
        )

    return {"query": skill_or_role, "resolved_node": matched_node, "next_steps": next_steps}
