import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

// Shared across the sidebar and AI panels; one request per minute at most.
const useAIStatus = () =>
  useQuery({
    queryKey: ["insights", "status"],
    queryFn: async () => (await api.get("/insights/status")).data.data,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
  });

export default useAIStatus;
