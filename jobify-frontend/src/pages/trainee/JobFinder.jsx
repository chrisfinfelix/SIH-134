import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  SimpleGrid,
  Flex,
  HStack,
  VStack,
  Badge,
  Icon,
  Divider,
  Select,
} from "@chakra-ui/react";
import { SearchIcon, CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/layout/PageShell";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";

const matchColor = (pct) => {
  if (pct >= 70) return "green";
  if (pct >= 40) return "orange";
  return "red";
};

const PAGE_SIZE = 10;

const JobFinder = () => {
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["trainee", "jobs", { district, state }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (district.trim()) params.append("district", district.trim());
      if (state.trim()) params.append("state", state.trim());
      const res = await api.get(`/trainee/jobs?${params.toString()}`);
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const hasSkills = data?.hasSkills;
  const allJobs = data?.jobs || [];
  const matchingJobs = allJobs.filter((j) => j.matchPercentage >= minMatch);
  const jobs = matchingJobs.slice(0, visibleCount);
  const placementChance = data?.placementChance;

  return (
    <PageShell
      role="trainee"
      title="Job Finder"
      subtitle="Live job postings ranked by how closely they match your registered skills"
      breadcrumbItems={[{ label: "Job Finder" }]}
    >
      {!isLoading && placementChance !== null && placementChance !== undefined && (
        <Box
          bg="#eaf6ef"
          borderWidth="1px"
          borderColor="#1A7F4B"
          borderRadius="md"
          p={4}
          mb={6}
        >
          <HStack spacing={3} align="center">
            <Icon as={CheckCircleIcon} color="#1A7F4B" boxSize={6} />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="#1A7F4B">
                Estimated Placement Chance: {placementChance}%
              </Text>
              <Text fontSize="xs" color="text.secondary">
                Based on placement outcomes of courses whose curriculum most closely matches your current skills.
              </Text>
            </Box>
          </HStack>
        </Box>
      )}

      {!isLoading && !hasSkills && (
        <Box
          bg="#fff8e6"
          borderWidth="1px"
          borderColor="#F6C453"
          borderRadius="md"
          p={4}
          mb={6}
        >
          <HStack spacing={3} align="flex-start">
            <Icon as={WarningIcon} color="#B7791F" mt={1} />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="#8a5a0a">
                No skills registered yet
              </Text>
              <Text fontSize="xs" color="#8a5a0a" mt={0.5}>
                Add your skills on the Skill Gap Analysis page so we can match you against relevant job postings.
              </Text>
              <Button
                as={RouterLink}
                to="/trainee/skill-gap"
                size="xs"
                mt={2}
                colorScheme="orange"
              >
                Add My Skills
              </Button>
            </Box>
          </HStack>
        </Box>
      )}

      {/* Filter Bar */}
      <Box
        bg="white"
        p={5}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              DISTRICT
            </Text>
            <Input
              size="sm"
              placeholder="Filter by district..."
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </Box>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              STATE
            </Text>
            <Input
              size="sm"
              placeholder="Filter by state..."
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </Box>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              MINIMUM MATCH
            </Text>
            <Select
              size="sm"
              value={minMatch}
              onChange={(e) => {
                setMinMatch(Number(e.target.value));
                setVisibleCount(PAGE_SIZE);
              }}
            >
              <option value={0}>Any match</option>
              <option value={25}>25% or better</option>
              <option value={50}>50% or better</option>
              <option value={75}>75% or better</option>
            </Select>
          </Box>
        </SimpleGrid>
        {!isLoading && (
          <Text fontSize="xs" color="text.muted" mt={3}>
            Showing {jobs.length} of {matchingJobs.length} matching job{matchingJobs.length === 1 ? "" : "s"}
            {matchingJobs.length !== allJobs.length && ` (${allJobs.length} total)`}
          </Text>
        )}
      </Box>

      {isLoading ? (
        <LoadingSpinner message="Matching live job postings against your skill profile..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No jobs found"
          description="Try clearing your district/state filters, or add more skills to widen your matches."
        />
      ) : (
        <VStack align="stretch" spacing={4} opacity={isFetching ? 0.7 : 1}>
          {jobs.map((job) => (
            <Box
              key={job.jobId}
              bg="white"
              p={5}
              borderRadius="md"
              borderWidth="1px"
              borderColor="#E2E8F0"
              borderLeft={`4px solid var(--chakra-colors-${matchColor(job.matchPercentage)}-500)`}
              boxShadow="sm"
            >
              <Flex justify="space-between" align="flex-start" wrap="wrap" gap={2} mb={2}>
                <Box>
                  <Heading as="h4" size="sm" fontWeight="700" color="text.primary">
                    {job.title}
                  </Heading>
                  <Text fontSize="xs" color="text.secondary">
                    {job.company} · {job.district || "—"}, {job.state || "—"}
                  </Text>
                </Box>
                <Badge
                  colorScheme={matchColor(job.matchPercentage)}
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {job.matchPercentage}% Match
                </Badge>
              </Flex>

              {job.salaryRange && (
                <Text fontSize="xs" color="text.muted" mb={2}>
                  Salary: {job.salaryRange}
                </Text>
              )}

              <Divider my={2} borderColor="#E2E8F0" />

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <Box>
                  <HStack spacing={1} mb={1}>
                    <Icon as={CheckCircleIcon} color="green.600" boxSize={3} />
                    <Text fontSize="2xs" fontWeight="700" color="green.700" textTransform="uppercase">
                      Skills You Have
                    </Text>
                  </HStack>
                  <Flex wrap="wrap" gap={1}>
                    {job.matchedSkills.length > 0 ? (
                      job.matchedSkills.map((s, i) => <SkillTag key={i} skill={s} colorScheme="green" size="sm" />)
                    ) : (
                      <Text fontSize="xs" color="text.muted">None yet</Text>
                    )}
                  </Flex>
                </Box>
                <Box>
                  <HStack spacing={1} mb={1}>
                    <Icon as={WarningIcon} color="red.600" boxSize={3} />
                    <Text fontSize="2xs" fontWeight="700" color="red.600" textTransform="uppercase">
                      Skills to Learn
                    </Text>
                  </HStack>
                  <Flex wrap="wrap" gap={1}>
                    {job.missingSkills.length > 0 ? (
                      job.missingSkills.map((s, i) => <SkillTag key={i} skill={s} colorScheme="red" size="sm" />)
                    ) : (
                      <Text fontSize="xs" color="green.600">You match every listed skill!</Text>
                    )}
                  </Flex>
                </Box>
              </SimpleGrid>
            </Box>
          ))}
          {matchingJobs.length > jobs.length && (
            <Button
              variant="outline"
              colorScheme="brand"
              size="sm"
              alignSelf="center"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Show {Math.min(PAGE_SIZE, matchingJobs.length - jobs.length)} more
            </Button>
          )}
        </VStack>
      )}
    </PageShell>
  );
};

export default JobFinder;
