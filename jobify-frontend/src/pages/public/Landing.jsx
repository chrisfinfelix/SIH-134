import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Flex,
  HStack,
  VStack,
  Icon,
  Badge,
  Divider,
} from "@chakra-ui/react";
import {
  SearchIcon,
  StarIcon,
  InfoOutlineIcon,
  CheckCircleIcon,
  RepeatIcon,
  LockIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../../components/layout/Navbar";
import StatCard from "../../components/shared/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const Landing = () => {
  const { user } = useAuth();

  // Fetch stats from backend if admin or use standard national benchmarks
  const { data: statsData } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: async () => {
      try {
        if (user?.role === "admin") {
          const res = await api.get("/admin/stats");
          return res.data?.data || {};
        }
        return null;
      } catch (e) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const totalJobs = statsData?.totalJobs || 12450;
  const totalCourses = statsData?.totalCourses || 840;
  const districtsCount = 766; // Standard Indian districts or from data
  const avgPlacement = statsData?.averagePlacementRate || 76.4;

  return (
    <Box minH="100vh" bg="#F4F6F9" display="flex" flexDirection="column">
      <Navbar />

      {/* Official Government Notice Bar */}
      <Box bg="#e6eef8" py={2} px={4} borderBottom="1px solid #CBD5E1">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" direction={{ base: "column", sm: "row" }} gap={1}>
            <HStack spacing={2}>
              <Badge colorScheme="brand" variant="solid" fontSize="2xs" px={1.5} py={0.2}>
                GOVERNMENT INITIATIVE
              </Badge>
              <Text fontSize="xs" color="brand.700" fontWeight="600">
                National Curriculum Alignment & Labour Market Information System (SIH 134)
              </Text>
            </HStack>
            <Text fontSize="xs" color="text.muted">
              Ministry of Skill Development & Entrepreneurship
            </Text>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bg="#003580" color="white" py={{ base: 12, md: 16 }} borderBottom="4px solid #FF6B00">
        <Container maxW="container.xl">
          <VStack spacing={6} align="flex-start" maxW="3xl">
            <Badge
              bg="#FF6B00"
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="wider"
            >
              BRIDGING SKILLS. BUILDING FUTURES.
            </Badge>

            <Heading as="h1" size={{ base: "xl", md: "2xl" }} fontWeight="800" letterSpacing="tight" lineHeight="1.2">
              Jobify — Labour Market Intelligence Platform
            </Heading>

            <Text fontSize={{ base: "md", md: "lg" }} color="gray.200" lineHeight="tall">
              India's government-grade digital platform linking vocational curricula directly with real-time industry demand. Analyse skill gaps, discover high-impact career pathways, and align workforce training nationwide.
            </Text>

            <HStack spacing={4} pt={2} wrap="wrap">
              <Button
                as={RouterLink}
                to="/trainee/pathways"
                size="lg"
                bg="#FF6B00"
                color="white"
                rightIcon={<ArrowForwardIcon />}
                _hover={{ bg: "#e66000" }}
                px={8}
                fontWeight="700"
              >
                Explore as Trainee
              </Button>
              <Button
                as={RouterLink}
                to="/login"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.15)" }}
                px={6}
                fontWeight="600"
              >
                Employer / Admin Login
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Live Stats Strip */}
      <Container maxW="container.xl" mt={-8} mb={10} zIndex={2}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <StatCard
            label="Total Active Jobs"
            value={totalJobs}
            icon={SearchIcon}
            color="brand.500"
            helpText="Live vacancies indexed"
          />
          <StatCard
            label="Vocational Courses"
            value={totalCourses}
            icon={StarIcon}
            color="brand.500"
            helpText="NSQF aligned curricula"
          />
          <StatCard
            label="Districts Monitored"
            value={districtsCount}
            icon={CheckCircleIcon}
            color="brand.500"
            helpText="Pan-India coverage"
          />
          <StatCard
            label="Avg. Placement Rate"
            value={`${avgPlacement}%`}
            icon={RepeatIcon}
            color="brand.500"
            helpText="National benchmark"
          />
        </SimpleGrid>
      </Container>

      {/* Three Pillars / Roles Section */}
      <Container maxW="container.xl" mb={14} flex="1">
        <VStack spacing={2} align="center" textAlign="center" mb={8}>
          <Text fontSize="xs" fontWeight="700" color="#FF6B00" textTransform="uppercase" letterSpacing="widest">
            Stakeholder Ecosystem
          </Text>
          <Heading as="h2" size="lg" fontWeight="700" color="text.primary">
            Built for Trainees, Employers, and Policymakers
          </Heading>
          <Text fontSize="sm" color="text.secondary" maxW="2xl">
            A unified tripartite architecture designed to eliminate curriculum lag and empower India's youth.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {/* Trainee Card */}
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            borderWidth="1px"
            borderColor="#E2E8F0"
            borderTop="4px solid #003580"
            boxShadow="sm"
          >
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="md"
              bg="#e6eef8"
              color="#003580"
              mb={4}
            >
              <Icon as={SearchIcon} boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" fontWeight="700" color="text.primary" mb={2}>
              For Trainees & Students
            </Heading>
            <Text fontSize="sm" color="text.secondary" mb={4} lineHeight="relaxed">
              Identify real-time skill gaps between your current profile and top market demands. Get personalized, ranked course recommendations that maximize your placement potential.
            </Text>
            <VStack align="flex-start" spacing={1.5} fontSize="xs" color="text.muted" mb={5}>
              <Text>• Career Pathway Finder by role</Text>
              <Text>• Instant Skill Gap breakdown</Text>
              <Text>• NSQF certified course directory</Text>
            </VStack>
            <Button
              as={RouterLink}
              to="/trainee"
              size="sm"
              colorScheme="brand"
              w="full"
            >
              Access Trainee Portal
            </Button>
          </Box>

          {/* Employer Card */}
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            borderWidth="1px"
            borderColor="#E2E8F0"
            borderTop="4px solid #FF6B00"
            boxShadow="sm"
          >
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="md"
              bg="#fff0e5"
              color="#FF6B00"
              mb={4}
            >
              <Icon as={CheckCircleIcon} boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" fontWeight="700" color="text.primary" mb={2}>
              For Employers & Industry
            </Heading>
            <Text fontSize="sm" color="text.secondary" mb={4} lineHeight="relaxed">
              Validate vocational training courses against real job requirements and broadcast forward-looking hiring demand signals across Indian districts and industrial clusters.
            </Text>
            <VStack align="flex-start" spacing={1.5} fontSize="xs" color="text.muted" mb={5}>
              <Text>• Curriculum relevance validation</Text>
              <Text>• Post hiring demand signals</Text>
              <Text>• Direct feedback to course creators</Text>
            </VStack>
            <Button
              as={RouterLink}
              to="/employer"
              size="sm"
              bg="#FF6B00"
              color="white"
              _hover={{ bg: "#e66000" }}
              w="full"
            >
              Access Employer Portal
            </Button>
          </Box>

          {/* Admin Card */}
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            borderWidth="1px"
            borderColor="#E2E8F0"
            borderTop="4px solid #1A7F4B"
            boxShadow="sm"
          >
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              borderRadius="md"
              bg="#eaf6ef"
              color="#1A7F4B"
              mb={4}
            >
              <Icon as={LockIcon} boxSize={6} />
            </Flex>
            <Heading as="h3" size="md" fontWeight="700" color="text.primary" mb={2}>
              For Admins & Authorities
            </Heading>
            <Text fontSize="sm" color="text.secondary" mb={4} lineHeight="relaxed">
              Monitor regional labor imbalances, identify outdated curricula with AI-driven gap scoring, review automated update recommendations, and bulk manage national job postings.
            </Text>
            <VStack align="flex-start" spacing={1.5} fontSize="xs" color="text.muted" mb={5}>
              <Text>• Macro skill demand analytics</Text>
              <Text>• District employment vs training index</Text>
              <Text>• Curriculum update recommendations</Text>
            </VStack>
            <Button
              as={RouterLink}
              to="/admin"
              size="sm"
              variant="outline"
              colorScheme="brand"
              w="full"
            >
              Access Admin Intelligence
            </Button>
          </Box>
        </SimpleGrid>
      </Container>

      {/* Official Government Footer */}
      <Box bg="#001b44" color="white" py={8} borderTop="1px solid #CBD5E1">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
            <Box>
              <HStack spacing={2} mb={2}>
                <Text fontSize="md" fontWeight="800">
                  Jobify
                </Text>
                <Badge colorScheme="orange" fontSize="2xs">
                  SIH 134
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.400" lineHeight="tall">
                National Labour Market Intelligence & Dynamic Curriculum Alignment Platform.
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="700" textTransform="uppercase" color="gray.300" mb={2}>
                Quick Navigation
              </Text>
              <VStack align="flex-start" spacing={1} fontSize="xs" color="gray.400">
                <RouterLink to="/trainee/pathways">Career Pathways</RouterLink>
                <RouterLink to="/trainee/courses">Course Directory</RouterLink>
                <RouterLink to="/login">Official Login</RouterLink>
                <RouterLink to="/register">Create Account</RouterLink>
              </VStack>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="700" textTransform="uppercase" color="gray.300" mb={2}>
                Compliance & Standards
              </Text>
              <Text fontSize="xs" color="gray.400" lineHeight="tall">
                Aligned with National Skills Qualifications Framework (NSQF) and NCVET guidelines.
              </Text>
            </Box>
          </SimpleGrid>

          <Divider borderColor="rgba(255,255,255,0.15)" mb={4} />

          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align="center"
            fontSize="xs"
            color="gray.400"
            gap={2}
          >
            <Text>
              Government of India | Ministry of Skill Development and Entrepreneurship | Jobify v1.0
            </Text>
            <Text>
              Smart India Hackathon 2024 / 2026 Initiative
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
