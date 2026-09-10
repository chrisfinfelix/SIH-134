import React from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  HStack,
  VStack,
  Flex,
  Icon,
  Badge,
} from "@chakra-ui/react";
import {
  SearchIcon,
  RepeatIcon,
  StarIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  InfoOutlineIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/shared/StatCard";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const TraineeDashboard = () => {
  const { user } = useAuth();

  // Fetch trending skills from backend
  const { data: trendingSkills = [], isLoading: isTrendingLoading } = useQuery({
    queryKey: ["skills", "demand"],
    queryFn: async () => {
      try {
        const res = await api.get("/skills/demand");
        const raw = res.data?.data;
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.skills)) return raw.skills;
        return [];
      } catch (err) {
        return [];
      }
    },
  });

  const userSkillCount = user?.skills?.length || 0;

  return (
    <PageShell
      role="trainee"
      title="Trainee Overview"
      subtitle="Track your vocational readiness and explore verified curriculum pathways"
      breadcrumbItems={[{ label: "Overview" }]}
    >
      {/* Welcome Banner */}
      <Box
        bg="#003580"
        color="white"
        p={{ base: 6, md: 8 }}
        borderRadius="md"
        borderLeft="6px solid #FF6B00"
        boxShadow="0 2px 4px rgba(0,0,0,0.06)"
        mb={6}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
        >
          <Box>
            <Badge bg="#FF6B00" color="white" fontSize="2xs" px={2} py={0.5} borderRadius="full" mb={2}>
              OFFICIAL TRAINEE DESK
            </Badge>
            <Heading as="h2" size="lg" fontWeight="700">
              Welcome, {user?.name || "Trainee"}
            </Heading>
            <Text fontSize="sm" color="gray.200" mt={1} maxW="xl">
              Find your path in India's job market. Benchmark your skill profile against national employment vacancies and bridge curriculum gaps.
            </Text>
          </Box>
          <Button
            as={RouterLink}
            to="/trainee/skill-gap"
            bg="#FF6B00"
            color="white"
            _hover={{ bg: "#e66000" }}
            rightIcon={<ArrowForwardIcon />}
            size="md"
            fontWeight="600"
            flexShrink={0}
          >
            Run Skill Gap Analysis
          </Button>
        </Flex>
      </Box>

      {/* Quick Stats Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} mb={6}>
        <StatCard
          label="Your Registered Skills"
          value={userSkillCount}
          icon={CheckCircleIcon}
          color="govSuccess.500"
          helpText={userSkillCount === 0 ? "Add skills in Gap Analysis" : "Active on your profile"}
        />
        <StatCard
          label="Trending Market Skills"
          value={trendingSkills.length > 0 ? trendingSkills.length : 20}
          icon={StarIcon}
          color="accent.500"
          helpText="Aggregated from live jobs"
        />
        <StatCard
          label="Career Pathways"
          value="100+"
          icon={SearchIcon}
          color="brand.500"
          helpText="Role-to-course mapping"
        />
      </SimpleGrid>

      {/* Quick Action Cards */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        <Box
          bg="white"
          p={6}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          boxShadow="sm"
          _hover={{ borderColor: "brand.500" }}
          transition="all 0.2s"
        >
          <Flex align="center" gap={3} mb={3}>
            <Flex
              w={10}
              h={10}
              borderRadius="md"
              bg="#e6eef8"
              color="brand.500"
              align="center"
              justify="center"
            >
              <Icon as={SearchIcon} boxSize={5} />
            </Flex>
            <Box>
              <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
                Find Pathways for a Target Role
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Explore required skills and ranked courses for any career role
              </Text>
            </Box>
          </Flex>
          <Text fontSize="sm" color="text.secondary" mb={4}>
            Search across job categories (e.g. Electrician, Full Stack Developer, Data Analyst) to view matching courses sorted by curriculum relevance.
          </Text>
          <Button
            as={RouterLink}
            to="/trainee/pathways"
            colorScheme="brand"
            size="sm"
            rightIcon={<ArrowForwardIcon />}
          >
            Search Role Pathways
          </Button>
        </Box>

        <Box
          bg="white"
          p={6}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          boxShadow="sm"
          _hover={{ borderColor: "#FF6B00" }}
          transition="all 0.2s"
        >
          <Flex align="center" gap={3} mb={3}>
            <Flex
              w={10}
              h={10}
              borderRadius="md"
              bg="#fff0e5"
              color="#FF6B00"
              align="center"
              justify="center"
            >
              <Icon as={RepeatIcon} boxSize={5} />
            </Flex>
            <Box>
              <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
                Analyse Your Skill Gap
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Compare your skill inventory with trending national demand
              </Text>
            </Box>
          </Flex>
          <Text fontSize="sm" color="text.secondary" mb={4}>
            Input your current competencies to identify missing skills and receive direct course recommendations tailored to fill your market gap.
          </Text>
          <Button
            as={RouterLink}
            to="/trainee/skill-gap"
            bg="#FF6B00"
            color="white"
            _hover={{ bg: "#e66000" }}
            size="sm"
            rightIcon={<ArrowForwardIcon />}
          >
            Launch Skill Gap Tool
          </Button>
        </Box>
      </SimpleGrid>

      {/* Trending Market Skills Strip */}
      <Box
        bg="white"
        p={5}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
          <Box>
            <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
              Trending In-Demand Market Skills
            </Heading>
            <Text fontSize="xs" color="text.muted">
              Top technical and vocational competencies sought by Indian employers today
            </Text>
          </Box>
          <Button
            as={RouterLink}
            to="/trainee/courses"
            variant="link"
            color="brand.500"
            fontSize="xs"
            fontWeight="600"
          >
            Browse All Courses →
          </Button>
        </Flex>

        {isTrendingLoading ? (
          <LoadingSpinner message="Fetching live skill trends..." />
        ) : (
          <Flex wrap="wrap" gap={1.5} pt={2}>
            {trendingSkills.slice(0, 15).map((item, idx) => {
              const skillName = typeof item === "string" ? item : item.skill || item.name || item._id;
              return (
                <SkillTag
                  key={idx}
                  skill={skillName}
                  colorScheme="orange"
                  size="md"
                />
              );
            })}
            {trendingSkills.length === 0 && (
              <Text fontSize="xs" color="text.muted">
                Python, React, Electrical Wiring, CAD Design, Data Analytics, PLC Programming, CNC Operation
              </Text>
            )}
          </Flex>
        )}
      </Box>
    </PageShell>
  );
};

export default TraineeDashboard;
