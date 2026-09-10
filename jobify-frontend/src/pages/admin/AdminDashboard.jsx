import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  HStack,
  VStack,
  Badge,
  Button,
  Icon,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@chakra-ui/react";
import {
  SearchIcon,
  StarIcon,
  CheckCircleIcon,
  WarningIcon,
  TimeIcon,
  RepeatIcon,
  ArrowForwardIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/shared/StatCard";
import SkillDemandBar from "../../components/charts/SkillDemandBar";
import DistrictTable from "../../components/charts/DistrictTable";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";

const KNOWN_STATES = [
  "All",
  "Kerala",
  "Karnataka",
  "Tamil Nadu",
  "Maharashtra",
  "Delhi",
  "Telangana",
  "Gujarat",
];

const AdminDashboard = () => {
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // 1. Fetch Admin Stats (Supports state & district query params)
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["admin", "stats", selectedState, selectedDistrict],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState !== "All") params.append("state", selectedState);
      if (selectedDistrict !== "All") params.append("district", selectedDistrict);
      const res = await api.get(`/admin/stats?${params.toString()}`);
      return res.data?.data || {};
    },
  });

  // 2. Fetch Skill Demand (Reactive to state & district)
  const { data: skillDemandData, isLoading: isSkillLoading } = useQuery({
    queryKey: ["admin", "skill-demand", selectedState, selectedDistrict],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState !== "All") params.append("state", selectedState);
      if (selectedDistrict !== "All") params.append("district", selectedDistrict);
      const res = await api.get(`/admin/skill-demand?${params.toString()}`);
      return res.data?.data?.skills || [];
    },
  });

  // 3. Fetch States Overview Summary
  const { data: statesSummaryData, isLoading: isStatesLoading } = useQuery({
    queryKey: ["admin", "states-summary"],
    queryFn: async () => {
      const res = await api.get("/admin/states-summary");
      return res.data?.data || [];
    },
  });

  // 4. Fetch District Summary (Reactive to state)
  const { data: districtSummaryData, isLoading: isDistrictLoading } = useQuery({
    queryKey: ["admin", "district-summary", selectedState],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedState !== "All") params.append("state", selectedState);
      const res = await api.get(`/admin/district-summary?${params.toString()}`);
      return res.data?.data || [];
    },
  });

  const stats = statsData || {};
  const highGapCount = stats.highGapCourses || 0;
  const statesSummary = statesSummaryData || [];

  return (
    <PageShell
      role="admin"
      title="National Labour Market & State Intelligence Hub"
      subtitle="Central government overview of national vocational alignment, state capacity, and district workforce dynamics"
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
      {/* ── State & District Geographic Filter Bar ──────────────────── */}
      <Box
        bg="white"
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap={4}
        >
          <Box>
            <HStack spacing={2}>
              <Badge colorScheme="orange" fontSize="2xs" px={2} py={0.5} borderRadius="sm">
                GEOGRAPHIC DRILL-DOWN
              </Badge>
              {selectedState !== "All" && (
                <Badge colorScheme="blue" fontSize="2xs" px={2} py={0.5} borderRadius="sm">
                  Active Filter: {selectedState}
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="text.muted" mt={1}>
              Switch between National Overview and State/District specific intelligence
            </Text>
          </Box>

          <HStack spacing={3} w={{ base: "full", md: "auto" }}>
            <Box minW="180px">
              <Select
                size="sm"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("All");
                }}
                bg="gray.50"
              >
                {KNOWN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st === "All" ? "🇮🇳 National Overview (All States)" : `📍 State: ${st}`}
                  </option>
                ))}
              </Select>
            </Box>

            {selectedState !== "All" && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => {
                  setSelectedState("All");
                  setSelectedDistrict("All");
                }}
              >
                Reset to National
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

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

      {/* 6 Key Stat Cards Grid (Reactive to selected state) */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={3} mb={8}>
        <StatCard
          label={selectedState === "All" ? "Total Jobs" : `${selectedState} Jobs`}
          value={stats.totalJobs || 0}
          icon={SearchIcon}
          color="brand.500"
        />
        <StatCard
          label={selectedState === "All" ? "Total Courses" : `${selectedState} Courses`}
          value={stats.totalCourses || 0}
          icon={StarIcon}
          color="brand.500"
        />
        <StatCard
          label="Training Institutes"
          value={stats.totalInstitutes || 0}
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

      {/* ── State-by-State Monitoring Table (National View) ────────── */}
      <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm" mb={8}>
        <CardHeader pb={2}>
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="sm" color="text.primary">
                State-Level Monitoring & Capacity Directory
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Compare job demand, courses offered, and accredited training institutes across Indian states
              </Text>
            </Box>
            <Badge colorScheme="orange" fontSize="xs" px={2} py={0.5} borderRadius="full">
              {statesSummary.length} States Tracked
            </Badge>
          </Flex>
        </CardHeader>
        <CardBody pt={2}>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>State / Territory</Th>
                <Th>Market Job Demand</Th>
                <Th>Courses Available</Th>
                <Th>Registered Institutes</Th>
                <Th>Quick Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {statesSummary.map((st) => {
                const isSelected = selectedState === st.state;
                return (
                  <Tr
                    key={st.state}
                    bg={isSelected ? "orange.50" : "transparent"}
                    _hover={{ bg: isSelected ? "orange.50" : "gray.50" }}
                  >
                    <Td fontWeight="600" color={isSelected ? "brand.500" : "text.primary"}>
                      <HStack spacing={2}>
                        <Text>{st.state}</Text>
                        {isSelected && (
                          <Badge colorScheme="orange" fontSize="2xs">
                            Active
                          </Badge>
                        )}
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" variant="solid" fontSize="xs">
                        {st.jobCount} Jobs
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="green" variant="subtle" fontSize="xs">
                        {st.courseCount} Courses
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple" variant="outline" fontSize="xs">
                        {st.instituteCount} Institutes
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="xs"
                        variant={isSelected ? "solid" : "outline"}
                        colorScheme={isSelected ? "orange" : "gray"}
                        onClick={() => setSelectedState(st.state)}
                      >
                        {isSelected ? "Viewing State" : "Filter State"}
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Analytics Charts & Tables Grid (State / National Reactive) */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        {/* Horizontal Skill Demand Bar Chart */}
        <Box>
          {isSkillLoading ? (
            <LoadingSpinner message="Calculating skill demand percentages..." />
          ) : (
            <SkillDemandBar data={skillDemandData} stateName={selectedState} />
          )}
        </Box>

        {/* District Employment & Course Balance Table */}
        <Box>
          {isDistrictLoading ? (
            <LoadingSpinner message="Aggregating district workforce indices..." />
          ) : (
            <DistrictTable data={districtSummaryData} stateName={selectedState} />
          )}
        </Box>
      </SimpleGrid>
    </PageShell>
  );
};

export default AdminDashboard;
