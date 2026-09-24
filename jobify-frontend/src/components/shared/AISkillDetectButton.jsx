import React from "react";
import { Button, Tooltip, useToast } from "@chakra-ui/react";
import { SunIcon } from "@chakra-ui/icons";
import { useMutation } from "@tanstack/react-query";
import api from "../../api/axios";

/**
 * Runs the ML NER pipeline over a job description and hands back the skills it
 * found that aren't already in `existingSkills` (case-insensitive).
 */
const AISkillDetectButton = ({ text, existingSkills = [], onDetected, size = "xs" }) => {
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async () => (await api.post("/insights/extract-skills", { text })).data.data.skills || [],
    onSuccess: (skills) => {
      const known = new Set(existingSkills.map((s) => s.toLowerCase()));
      const fresh = [...new Set(skills)].filter((s) => !known.has(s.toLowerCase()));
      onDetected(fresh);
      toast({
        title: fresh.length ? `AI detected ${fresh.length} new skill${fresh.length === 1 ? "" : "s"}` : "No new skills detected",
        description: fresh.length ? fresh.join(", ") : "Try describing the tools and competencies the role needs.",
        status: fresh.length ? "success" : "info",
        duration: 4000,
        isClosable: true,
      });
    },
    onError: (err) =>
      toast({
        title: "AI skill detection unavailable",
        description: err.response?.data?.message || "The ML service could not be reached.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      }),
  });

  const hasText = (text || "").trim().length >= 15;

  return (
    <Tooltip label={hasText ? "Extract skills from the description with the NER model" : "Write a description first"} hasArrow>
      <Button
        size={size}
        colorScheme="purple"
        variant="outline"
        leftIcon={<SunIcon />}
        onClick={() => mutation.mutate()}
        isLoading={mutation.isPending}
        loadingText="Detecting…"
        isDisabled={!hasText}
      >
        Detect skills with AI
      </Button>
    </Tooltip>
  );
};

export default AISkillDetectButton;
