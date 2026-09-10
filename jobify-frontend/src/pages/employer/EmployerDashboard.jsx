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
  CheckCircleIcon,
  AddIcon,
  ArrowForwardIcon,
  StarIcon,
  SearchIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/shared/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const EmployerDashboard = () => {
  const { user } = useAuth();

  // Fetch employer's validations
  const { data: validations = [] } = useQuery({
    queryKey: ["employer", "validations"],
    queryFn: async () => {
      try {
        const res = await api.get("/employer/validations");
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Fetch employer's demand signals
  const { data: signals = [] } = useQuery({
    queryKey: ["employer", "demand-signals"],
    queryFn: async () => {
      try {
        const res = await api.get("/employer/demand-signals");
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    },
  });

  const totalHires = signals.reduce((acc, sig) => acc + (Number(sig.hiringCount) || 0), 0);

  return (
    <PageShell
      role="employer"
      title="Employer Industry Desk"
      subtitle="Validate vocational training curricula and broadcast direct hiring demand signals"
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
              INDUSTRY VALIDATION PARTNER
            </Badge>
            <Heading as="h2" size="lg" fontWeight="700">
              Welcome, {user?.organization || user?.name || "Industry Partner"}
            </Heading>
            <Text fontSize="sm" color="gray.200" mt={1} maxW="xl">
              Collaborate directly with national training institutes to ensure classroom syllabi accurately reflect actual on-the-ground industrial workflows.
            </Text>
          </Box>
          <HStack spacing={3} wrap="wrap">
            <Button
              as={RouterLink}
              to="/employer/demand-signals"
              bg="#FF6B00"
              color="white"
              _hover={{ bg: "#e66000" }}
              rightIcon={<AddIcon />}
              size="md"
              fontWeight="600"
            >
              Post Demand Signal
            </Button>
            <Button
              as={RouterLink}
              to="/employer/validate"
              variant="outline"
              borderColor="white"
              color="white"
              _hover={{ bg: "rgba(255,255,255,0.15)" }}
              size="md"
              fontWeight="600"
            >
              Validate Courses
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Stat Row */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} mb={8}>
        <StatCard
          label="Courses Validated"
          value={validations.length}
          icon={CheckCircleIcon}
          color="govSuccess.500"
          helpText="Curriculum reviews submitted"
        />
        <StatCard
          label="Demand Signals Posted"
          value={signals.length}
          icon={StarIcon}
          color="brand.500"
          helpText="Active hiring forecasts"
        />
        <StatCard
          label="Total Planned Hires"
          value={totalHires}
          icon={AddIcon}
          color="accent.500"
          helpText="Trainee demand registered"
        />
      </SimpleGrid>

      {/* Quick Action Navigation Panels */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box
          bg="white"
          p={6}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          boxShadow="sm"
        >
          <Flex align="center" gap={3} mb={3}>
            <Flex
              w={10}
              h={10}
              borderRadius="md"
              bg="#eaf6ef"
              color="govSuccess.500"
              align="center"
              justify="center"
            >
              <Icon as={CheckCircleIcon} boxSize={5} />
            </Flex>
            <Box>
              <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
                Validate Vocational Courses
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Audit and rate curriculum modules against job market standards
              </Text>
            </Box>
          </Flex>
          <Text fontSize="sm" color="text.secondary" mb={4}>
            Review national course syllabi and certify whether the taught skills meet modern operational standards or require immediate modernization.
          </Text>
          <Button
            as={RouterLink}
            to="/employer/validate"
            colorScheme="brand"
            size="sm"
            rightIcon={<ArrowForwardIcon />}
          >
            Open Course Validator
          </Button>
        </Box>

        <Box
          bg="white"
          p={6}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          boxShadow="sm"
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
              <Icon as={AddIcon} boxSize={5} />
            </Flex>
            <Box>
              <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
                Broadcast Demand Signals
              </Heading>
              <Text fontSize="xs" color="text.muted">
                Publish district-wise hiring targets and skill requirements
              </Text>
            </Box>
          </Flex>
          <Text fontSize="sm" color="text.secondary" mb={4}>
            Notify state training boards of upcoming hiring drives, target skill sets, and required headcounts across Indian industrial clusters.
          </Text>
          <Button
            as={RouterLink}
            to="/employer/demand-signals"
            bg="#FF6B00"
            color="white"
            _hover={{ bg: "#e66000" }}
            size="sm"
            rightIcon={<ArrowForwardIcon />}
          >
            Post Hiring Signal
          </Button>
        </Box>
      </SimpleGrid>
    </PageShell>
  );
};

export default EmployerDashboard;
