import React from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  HStack,
  Badge,
  Button,
  Icon,
} from "@chakra-ui/react";
import {
  SearchIcon,
  StarIcon,
  CheckCircleIcon,
  WarningIcon,
  TimeIcon,
  RepeatIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/shared/StatCard";
import SkillDemandBar from "../../components/charts/SkillDemandBar";
import DistrictTable from "../../components/charts/DistrictTable";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";

const AdminDashboard = () => {
  // 1. Fetch Admin General Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats");
      return res.data?.data || {};
    },
  });

  // 2. Fetch Skill Demand
  const { data: skillDemandData, isLoading: isSkillLoading } = useQuery({
    queryKey: ["admin", "skill-demand"],
    queryFn: async () => {
      const res = await api.get("/admin/skill-demand");
      return res.data?.data?.skills || [];
    },
  });

  // 3. Fetch District Summary
  const { data: districtSummaryData, isLoading: isDistrictLoading } = useQuery({
    queryKey: ["admin", "district-summary"],
    queryFn: async () => {
      const res = await api.get("/admin/district-summary");
      return res.data?.data || [];
    },
  });

  const stats = statsData || {};
  const highGapCount = stats.highGapCourses || 0;

  return (
    <PageShell
      role="admin"
      title="National Labour Market Intelligence"
      subtitle="Executive analytics on national vocational alignment, industry demand signals, and regional workforce balance"
      breadcrumbItems={[{ label: "Executive Dashboard" }]}
      action={
        <HStack spacing={2}>
          <Button
            as={RouterLink}
            to="/admin/recommendations"
            size="sm"
            colorScheme="brand"
            rightIcon={<ArrowForwardIcon />}
          >
            Curriculum Updates
          </Button>
          <Button
            as={RouterLink}
            to="/admin/jobs"
            size="sm"
            bg="#FF6B00"
            color="white"
            _hover={{ bg: "#e66000" }}
          >
            Manage Jobs
          </Button>
        </HStack>
      }
    >
      {/* High Gap Alert Banner if applicable */}
      {highGapCount > 0 && (
        <Box
          bg="#fde8e8"
          p={4}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#fca5a5"
          borderLeft="6px solid #C0392B"
          mb={6}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            <HStack spacing={3}>
              <Icon as={WarningIcon} color="red.600" boxSize={5} />
              <Box>
                <Text fontSize="sm" fontWeight="700" color="red.800">
                  Critical Curriculum Lag Detected ({highGapCount} Courses Flagged)
                </Text>
                <Text fontSize="xs" color="red.700">
                  Vocational programs with high market gap scores require immediate module updates or modernization.
                </Text>
              </Box>
            </HStack>
            <Button
              as={RouterLink}
              to="/admin/recommendations"
              size="xs"
              colorScheme="red"
            >
              Review Flagged Courses
            </Button>
          </Flex>
        </Box>
      )}

      {/* 6 Key Stat Cards Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={3} mb={8}>
        <StatCard
          label="Total Jobs"
          value={stats.totalJobs || 0}
          icon={SearchIcon}
          color="brand.500"
        />
        <StatCard
          label="Total Courses"
          value={stats.totalCourses || 0}
          icon={StarIcon}
          color="brand.500"
        />
        <StatCard
          label="Indexed Skills"
          value={stats.totalSkills || 0}
          icon={CheckCircleIcon}
          color="brand.500"
        />
        <StatCard
          label="Employers"
          value={stats.totalEmployers || 0}
          icon={RepeatIcon}
          color="accent.500"
        />
        <StatCard
          label="Trainees"
          value={stats.totalTrainees || 0}
          icon={TimeIcon}
          color="accent.500"
        />
        <StatCard
          label="Avg Placement"
          value={stats.averagePlacementRate ? `${stats.averagePlacementRate}%` : "—"}
          icon={CheckCircleIcon}
          color="govSuccess.500"
        />
      </SimpleGrid>

      {/* Analytics Charts & Tables Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Horizontal Skill Demand Bar Chart */}
        <Box>
          {isSkillLoading ? (
            <LoadingSpinner message="Calculating national skill demand percentages..." />
          ) : (
            <SkillDemandBar data={skillDemandData} />
          )}
        </Box>

        {/* District Employment & Course Balance Table */}
        <Box>
          {isDistrictLoading ? (
            <LoadingSpinner message="Aggregating district workforce indices..." />
          ) : (
            <DistrictTable data={districtSummaryData} />
          )}
        </Box>
      </SimpleGrid>
    </PageShell>
  );
};

export default AdminDashboard;
