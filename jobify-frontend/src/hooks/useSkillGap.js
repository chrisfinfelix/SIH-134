import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export const useSkillGap = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  // Fetch skill gap calculation
  const skillGapQuery = useQuery({
    queryKey: ["trainee", "skill-gap"],
    queryFn: async () => {
      const res = await api.get("/trainee/skill-gap");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Mutation to update trainee skills
  const updateSkillsMutation = useMutation({
    mutationFn: async (skills) => {
      const res = await api.put("/trainee/skills", { skills });
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      updateUser({ skills: updatedUser.skills });
      // Invalidate and refetch skill-gap query
      queryClient.invalidateQueries({ queryKey: ["trainee", "skill-gap"] });
    },
  });

  return {
    skillGapData: skillGapQuery.data,
    isLoading: skillGapQuery.isLoading,
    isError: skillGapQuery.isError,
    error: skillGapQuery.error,
    refetchSkillGap: skillGapQuery.refetch,
    updateSkills: updateSkillsMutation.mutateAsync,
    isUpdating: updateSkillsMutation.isPending,
  };
};

export default useSkillGap;
