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
  CheckCircleIcon,
  RepeatIcon,
  LockIcon,
  ArrowForwardIcon,
  AtSignIcon,
} from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../../components/layout/Navbar";
import StatCard from "../../components/shared/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const DASHBOARD_BY_ROLE = { trainee: "/trainee", employer: "/employer", institute: "/institute", admin: "/admin" };

const PORTALS = [
  {
    title: "For Trainees & Students",
    accent: "#003580",
    tint: "#e6eef8",
    icon: SearchIcon,
    description:
      "Identify real-time skill gaps between your current profile and top market demands. Get personalised, ranked course recommendations that maximise your placement potential.",
    features: ["Career Pathway Finder by role", "Instant skill-gap breakdown", "AI career graph & job matching"],
    to: "/trainee",
    cta: "Access Trainee Portal",
    hover: "#002863",
  },
  {
    title: "For Employers & Industry",
    accent: "#E66000",
    tint: "#fff0e5",
    icon: CheckCircleIcon,
    description:
      "Validate vocational training courses against real job requirements and broadcast forward-looking hiring demand signals across Indian districts and industrial clusters.",
    features: ["Curriculum relevance validation", "Hiring demand signals", "AI skill extraction for job posts"],
    to: "/employer",
    cta: "Access Employer Portal",
    hover: "#c75300",
  },
  {
    title: "For Admins & Authorities",
    accent: "#1A7F4B",
    tint: "#eaf6ef",
    icon: LockIcon,
    description:
      "Monitor regional labour imbalances, identify outdated curricula with data-driven gap scoring, forecast demand, and plan district training budgets.",
    features: ["Macro skill demand analytics", "Demand forecasting & trend alerts", "District training plan optimiser"],
    to: "/admin",
    cta: "Access Admin Intelligence",
    hover: "#14663c",
  },
  {
    title: "For Training Institutes",
    accent: "#6B46C1",
    tint: "#f0e9fa",
    icon: AtSignIcon,
    description:
      "Manage your course catalogue, track curriculum alignment with regional market demand, and monitor placement outcomes across your training programmes.",
    features: ["Course & curriculum management", "Market alignment & oversupply risk", "Placement outcome tracking"],
    to: "/institute",
    cta: "Access Institute Portal",
    hover: "#553C9A",
  },
];

const PortalCard = ({ title, accent, tint, icon, description, features, to, cta, hover }) => (
  <Flex
    direction="column"
    bg="white"
    p={6}
    borderRadius="md"
    borderWidth="1px"
    borderColor="#E2E8F0"
    borderTop={`4px solid ${accent}`}
    boxShadow="sm"
    transition="box-shadow 0.15s ease, transform 0.15s ease"
    _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
  >
    <Flex w={12} h={12} align="center" justify="center" borderRadius="md" bg={tint} color={accent} mb={4}>
      <Icon as={icon} boxSize={6} />
    </Flex>
    <Heading as="h3" size="md" fontWeight="700" color="text.primary" mb={2}>
      {title}
    </Heading>
    <Text fontSize="sm" color="text.secondary" mb={4} lineHeight="relaxed">
      {description}
    </Text>
    <VStack align="flex-start" spacing={1.5} fontSize="xs" color="text.muted" mb={5}>
      {features.map((f) => (
        <Text key={f}>• {f}</Text>
      ))}
    </VStack>
    <Button as={RouterLink} to={to} size="sm" bg={accent} color="white" _hover={{ bg: hover }} w="full" mt="auto">
      {cta}
    </Button>
  </Flex>
);

const PIPELINE_STEPS = [
  ["Ingest", "Job portals, employer surveys, placement records & syllabi — deduplicated"],
  ["Understand", "BERT NER + gazetteer extract skills; DistilBERT maps titles to NCO codes"],
  ["Forecast", "Global LightGBM demand forecasts; BERTopic flags emerging skills"],
  ["Act", "Ranked curriculum updates, oversupply alerts & LP district training plans"],
];

const AIPipelinePanel = () => (
  <Box
    bg="rgba(255,255,255,0.06)"
    border="1px solid rgba(255,255,255,0.18)"
    borderRadius="lg"
    p={{ base: 5, md: 6 }}
    display={{ base: "none", md: "block" }}
  >
    <HStack justify="space-between" mb={4}>
      <Text fontSize="xs" fontWeight="700" letterSpacing="widest" color="gray.300">
        HOW THE INTELLIGENCE ENGINE WORKS
      </Text>
      <Badge colorScheme="purple" variant="solid" fontSize="2xs">
        AI
      </Badge>
    </HStack>
    <VStack align="stretch" spacing={0}>
      {PIPELINE_STEPS.map(([step, detail], idx) => {
        const isLast = idx === PIPELINE_STEPS.length - 1;
        return (
          <Flex key={step} gap={4}>
            <Flex direction="column" align="center">
              <Flex
                w={8}
                h={8}
                borderRadius="full"
                bg={isLast ? "#FF6B00" : "white"}
                color={isLast ? "white" : "#003580"}
                align="center"
                justify="center"
                fontWeight="800"
                fontSize="sm"
                flexShrink={0}
              >
                {idx + 1}
              </Flex>
              {!isLast && <Box w="2px" flex="1" minH="18px" bg="rgba(255,255,255,0.25)" />}
            </Flex>
            <Box pb={isLast ? 0 : 4}>
              <Text fontWeight="700" fontSize="md">
                {step}
              </Text>
              <Text fontSize="sm" color="gray.300" lineHeight="short">
                {detail}
              </Text>
            </Box>
          </Flex>
        );
      })}
    </VStack>
  </Box>
);

const Landing = () => {
  const { user } = useAuth();

  const { data: stats, isError: statsError } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: async () => (await api.get("/public/stats")).data.data,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  // Never show invented numbers: "…" while loading, "—" if the API is unreachable
  const statValue = (v, suffix = "") =>
    stats ? (v == null ? "—" : `${v.toLocaleString("en-IN")}${suffix}`) : statsError ? "—" : "…";

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
      <Box bg="#003580" color="white" pt={{ base: 12, md: 16 }} pb={{ base: 16, md: 20 }} borderBottom="4px solid #FF6B00">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 10, lg: 12 }} alignItems="center">
            <VStack spacing={6} align="flex-start">
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
                India&apos;s digital platform linking vocational curricula directly with real-time industry demand. Analyse skill gaps, discover high-impact career pathways, and align workforce training nationwide.
              </Text>

              <HStack spacing={4} pt={2} wrap="wrap">
                <Button
                  as={RouterLink}
                  to={user ? DASHBOARD_BY_ROLE[user.role] || "/trainee" : "/login"}
                  size="lg"
                  bg="#FF6B00"
                  color="white"
                  rightIcon={<ArrowForwardIcon />}
                  _hover={{ bg: "#e66000" }}
                  px={8}
                  fontWeight="700"
                >
                  {user ? "Go to My Dashboard" : "Login to Get Started"}
                </Button>
                {!user && (
                  <Button
                    as={RouterLink}
                    to="/register"
                    size="lg"
                    variant="outline"
                    borderColor="white"
                    color="white"
                    _hover={{ bg: "rgba(255,255,255,0.15)" }}
                    px={6}
                    fontWeight="600"
                  >
                    Create an Account
                  </Button>
                )}
              </HStack>
            </VStack>

            <AIPipelinePanel />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Live Stats Strip */}
      <Container maxW="container.xl" mt={-8} mb={10} zIndex={2}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <StatCard
            label="Total Active Jobs"
            value={statValue(stats?.totalJobs)}
            icon={SearchIcon}
            color="brand.500"
            helpText="Live vacancies indexed"
          />
          <StatCard
            label="Vocational Courses"
            value={statValue(stats?.totalCourses)}
            icon={StarIcon}
            color="brand.500"
            helpText="Registered training programmes"
          />
          <StatCard
            label="Districts Covered"
            value={statValue(stats?.districtsCovered)}
            icon={CheckCircleIcon}
            color="brand.500"
            helpText="With jobs or courses on record"
          />
          <StatCard
            label="Avg. Placement Rate"
            value={statValue(stats?.averagePlacementRate, "%")}
            icon={RepeatIcon}
            color="brand.500"
            helpText="Across tracked courses"
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

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
          {PORTALS.map((portal) => (
            <PortalCard key={portal.to} {...portal} />
          ))}
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
              Smart India Hackathon 2026 · Problem Statement 134
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
