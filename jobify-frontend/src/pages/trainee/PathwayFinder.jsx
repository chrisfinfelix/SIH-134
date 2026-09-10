import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  Flex,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Collapse,
  IconButton,
  useDisclosure,
  useToast,
  Divider,
  Select,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  ButtonGroup,
  Card,
  CardBody,
} from "@chakra-ui/react";
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  WarningIcon,
  StarIcon,
  InfoOutlineIcon,
  AddIcon,
} from "@chakra-ui/icons";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const INDIAN_STATES = [
  "Kerala",
  "Karnataka",
  "Tamil Nadu",
  "Maharashtra",
  "Delhi",
  "Telangana",
  "Gujarat",
  "Uttar Pradesh",
  "West Bengal",
  "Rajasthan",
];

const SUGGESTED_SKILLS = [
  "JavaScript",
  "React",
  "Node.js",
  "Python",
  "FastAPI",
  "SQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Machine Learning",
  "Git",
  "Java",
  "Flutter",
  "Cybersecurity",
];

const CourseRow = ({ course }) => {
  const { isOpen, onToggle } = useDisclosure();
  const match = course.matchPercentage || 0;
  const matchColor = match >= 70 ? "green" : match >= 40 ? "orange" : "red";

  const getModeColor = (mode) => {
    if (mode === "Online") return "teal";
    if (mode === "Offline") return "purple";
    if (mode === "Hybrid") return "blue";
    return "gray";
  };

  return (
    <>
      <Tr _hover={{ bg: "gray.50" }}>
        <Td fontWeight="600" color="text.primary">
          <Flex align="center" gap={2}>
            <IconButton
              size="xs"
              variant="ghost"
              icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={onToggle}
              aria-label="Toggle details"
            />
            <Box>
              <Text>{course.courseName}</Text>
              {course.sector && (
                <Text fontSize="2xs" color="text.muted" fontWeight="normal">
                  Sector: {course.sector}
                </Text>
              )}
            </Box>
          </Flex>
        </Td>
        <Td color="text.secondary">
          <Text fontWeight="500">{course.provider || "National Skill Center"}</Text>
        </Td>
        <Td>
          <VStack align="flex-start" spacing={0.5}>
            <Text fontSize="xs" fontWeight="600">{course.state || "Pan-India"}</Text>
            <Text fontSize="2xs" color="text.muted">{course.district || "All Districts"}</Text>
          </VStack>
        </Td>
        <Td>
          <Badge colorScheme={getModeColor(course.deliveryMode)} variant="subtle" fontSize="2xs" px={2} py={0.5} borderRadius="full">
            {course.deliveryMode || "Online"}
          </Badge>
        </Td>
        <Td>{course.durationWeeks ? `${course.durationWeeks} wks` : "8 wks"}</Td>
        <Td minW="140px">
          <Flex align="center" gap={2}>
            <Progress
              value={match}
              size="xs"
              colorScheme={matchColor}
              borderRadius="full"
              flex="1"
            />
            <Text fontSize="xs" fontWeight="700" color={`${matchColor}.600`} w="36px">
              {match}%
            </Text>
          </Flex>
        </Td>
        <Td>
          <HStack spacing={1} wrap="wrap">
            {(course.matchedSkills || []).slice(0, 3).map((s, i) => (
              <SkillTag key={i} skill={s} colorScheme="green" size="sm" />
            ))}
            {(course.matchedSkills || []).length > 3 && (
              <Badge fontSize="2xs" colorScheme="green">+{course.matchedSkills.length - 3}</Badge>
            )}
          </HStack>
        </Td>
      </Tr>

      {/* Expandable Details */}
      <Tr>
        <Td colSpan={7} p={0} borderBottom={isOpen ? "1px solid #E2E8F0" : "none"}>
          <Collapse in={isOpen} animateOpacity>
            <Box p={4} bg="#F8FAFC" borderLeft="4px solid #003580">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="green.700" textTransform="uppercase" mb={1.5}>
                    Competencies Covered in this Course ({course.matchedSkills?.length || 0}):
                  </Text>
                  <Flex wrap="wrap" gap={1}>
                    {(course.matchedSkills || []).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="green" size="sm" />
                    ))}
                    {(course.matchedSkills || []).length === 0 && (
                      <Text fontSize="xs" color="text.muted">
                        None specifically listed
                      </Text>
                    )}
                  </Flex>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="red.600" textTransform="uppercase" mb={1.5}>
                    Remaining Role Skills Not in this Course ({course.missingSkills?.length || 0}):
                  </Text>
                  <Flex wrap="wrap" gap={1}>
                    {(course.missingSkills || []).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="red" size="sm" />
                    ))}
                    {(course.missingSkills || []).length === 0 && (
                      <Text fontSize="xs" color="green.600" fontWeight="600">
                        Complete curriculum match! Covers all target competencies.
                      </Text>
                    )}
                  </Flex>
                </Box>
              </SimpleGrid>
            </Box>
          </Collapse>
        </Td>
      </Tr>
    </>
  );
};

const PathwayFinder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const initialRole = searchParams.get("targetRole") || user?.targetRole || "Full Stack Developer";
  const [targetRole, setTargetRole] = useState(initialRole);
  const [primaryState, setPrimaryState] = useState(user?.primaryState || "Kerala");
  const [preferredStates, setPreferredStates] = useState(user?.preferredStates || ["Karnataka", "Tamil Nadu"]);
  const [deliveryMode, setDeliveryMode] = useState(user?.preferredDeliveryMode || "All");
  const [skills, setSkills] = useState(user?.skills || ["React", "JavaScript", "HTML"]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Fetch Trainee Preferences if logged in
  const { data: userPreferences } = useQuery({
    queryKey: ["trainee", "preferences"],
    queryFn: async () => {
      const res = await api.get("/trainee/preferences");
      return res.data?.data;
    },
    enabled: !!user,
    onSuccess: (prefs) => {
      if (prefs) {
        if (prefs.targetRole) setTargetRole(prefs.targetRole);
        if (prefs.primaryState) setPrimaryState(prefs.primaryState);
        if (prefs.preferredStates) setPreferredStates(prefs.preferredStates);
        if (prefs.preferredDeliveryMode) setDeliveryMode(prefs.preferredDeliveryMode);
        if (prefs.skills) setSkills(prefs.skills);
      }
    },
  });

  // Query Pathways
  const {
    data: pathwayData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "trainee",
      "pathways",
      targetRole,
      primaryState,
      preferredStates.join(","),
      deliveryMode,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        targetRole,
        primaryState,
        preferredStates: preferredStates.join(","),
        deliveryMode,
      });
      const res = await api.get(`/trainee/pathways?${params.toString()}`);
      return res.data?.data;
    },
    enabled: !!targetRole,
  });

  // Save Preferences Mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put("/trainee/preferences", {
        targetRole,
        primaryState,
        preferredStates,
        preferredDeliveryMode: deliveryMode,
        skills,
      });
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your target role, regional states, and skills preferences have been updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries(["trainee", "preferences"]);
    },
    onError: (err) => {
      toast({
        title: "Save Failed",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }
    setSkills([...skills, trimmed]);
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const togglePreferredState = (stateName) => {
    if (preferredStates.includes(stateName)) {
      setPreferredStates(preferredStates.filter((s) => s !== stateName));
    } else {
      setPreferredStates([...preferredStates, stateName]);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setSearchParams({ targetRole });
    refetch();
  };

  const courses = pathwayData?.recommendedCourses || pathwayData?.courses || [];
  const requiredSkills = pathwayData?.requiredSkills || [];
  const skillsToDevelop = pathwayData?.skillsToDevelop || [];
  const regionalTrending = pathwayData?.regionalTrendingSkills || [];
  const matchPercentage = pathwayData?.matchPercentage ?? 0;

  return (
    <PageShell
      role="trainee"
      title="Personalized Career Pathway Finder"
      subtitle="Discover tailored learning pathways with regional state insights, delivery modes, and trending skill analysis"
      breadcrumbItems={[{ label: "Pathway Finder" }]}
    >
      {/* ── Filter & Search Control Panel ────────────────────────── */}
      <Box
        bg="white"
        p={{ base: 4, md: 6 }}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <VStack spacing={5} align="stretch">
          {/* Row 1: Target Role Input & Search */}
          <Box>
            <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1.5} textTransform="uppercase">
              1. Target Career Role
            </Text>
            <Flex direction={{ base: "column", sm: "row" }} gap={3}>
              <Input
                size="md"
                placeholder="e.g. Full Stack Developer, Data Analyst, Cloud Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                bg="gray.50"
              />
              <Button
                colorScheme="brand"
                px={6}
                leftIcon={<SearchIcon />}
                onClick={handleSearch}
                isLoading={isLoading || isFetching}
              >
                Find Pathways
              </Button>
            </Flex>

            {/* Quick Suggestions */}
            <HStack spacing={2} mt={2} wrap="wrap" fontSize="xs">
              <Text fontSize="2xs" color="text.muted" fontWeight="600">Quick Roles:</Text>
              {["Full Stack Developer", "Data Analyst", "Cloud Engineer", "Electrician", "DevOps Engineer"].map((r) => (
                <Button
                  key={r}
                  size="xs"
                  variant="outline"
                  borderColor="#E2E8F0"
                  isActive={targetRole === r}
                  onClick={() => {
                    setTargetRole(r);
                    setSearchParams({ targetRole: r });
                  }}
                >
                  {r}
                </Button>
              ))}
            </HStack>
          </Box>

          <Divider borderColor="#E2E8F0" />

          {/* Row 2: Geographic & Delivery Mode Configuration */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {/* Primary State */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1.5} textTransform="uppercase">
                2. Primary State (Home)
              </Text>
              <Select
                value={primaryState}
                onChange={(e) => setPrimaryState(e.target.value)}
                bg="gray.50"
                size="sm"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Delivery Mode */}
            <Box>
              <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1.5} textTransform="uppercase">
                3. Delivery Mode
              </Text>
              <ButtonGroup size="sm" isAttached variant="outline" w="full">
                {["All", "Online", "Offline", "Hybrid"].map((mode) => (
                  <Button
                    key={mode}
                    flex="1"
                    onClick={() => setDeliveryMode(mode)}
                    bg={deliveryMode === mode ? "brand.500" : "transparent"}
                    color={deliveryMode === mode ? "white" : "text.secondary"}
                    borderColor={deliveryMode === mode ? "brand.500" : "#E2E8F0"}
                    _hover={{ bg: deliveryMode === mode ? "brand.600" : "gray.50" }}
                  >
                    {mode}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* Save Profile Button */}
            <Box display="flex" alignItems="flex-end">
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                w="full"
                onClick={() => savePreferencesMutation.mutate()}
                isLoading={savePreferencesMutation.isLoading}
              >
                Save as Default Preferences
              </Button>
            </Box>
          </SimpleGrid>

          {/* Additional Preferred States Multi-Select */}
          <Box>
            <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1.5} textTransform="uppercase">
              Additional Preferred States (Click to toggle):
            </Text>
            <Flex wrap="wrap" gap={2}>
              {INDIAN_STATES.filter((s) => s !== primaryState).map((st) => {
                const isSelected = preferredStates.includes(st);
                return (
                  <Button
                    key={st}
                    size="xs"
                    variant={isSelected ? "solid" : "outline"}
                    colorScheme={isSelected ? "blue" : "gray"}
                    onClick={() => togglePreferredState(st)}
                  >
                    {isSelected ? `✓ ${st}` : `+ ${st}`}
                  </Button>
                );
              })}
            </Flex>
          </Box>

          <Divider borderColor="#E2E8F0" />

          {/* Row 3: Current Trainee Skills */}
          <Box>
            <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1.5} textTransform="uppercase">
              4. Your Current Competencies & Skills
            </Text>
            <Flex gap={2} mb={2}>
              <Input
                size="sm"
                placeholder="Type a skill (e.g. Python, SQL, Docker) and press Enter"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                bg="gray.50"
              />
              <Button size="sm" colorScheme="gray" leftIcon={<AddIcon />} onClick={() => handleAddSkill()}>
                Add
              </Button>
            </Flex>

            {/* Current Skills Tags */}
            <Flex wrap="wrap" gap={1.5} mb={2}>
              {skills.map((skill) => (
                <Tag key={skill} size="md" colorScheme="green" borderRadius="full">
                  <TagLabel>{skill}</TagLabel>
                  <TagCloseButton onClick={() => handleRemoveSkill(skill)} />
                </Tag>
              ))}
              {skills.length === 0 && (
                <Text fontSize="xs" color="text.muted">
                  No skills selected. Add your skills to see personalized match percentages.
                </Text>
              )}
            </Flex>

            {/* Quick Skill Suggestions */}
            <HStack spacing={1.5} wrap="wrap" fontSize="2xs">
              <Text color="text.muted">Suggestions:</Text>
              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
                <Button key={s} size="2xs" variant="ghost" color="brand.500" onClick={() => handleAddSkill(s)}>
                  + {s}
                </Button>
              ))}
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* ── Competency Alignment & Pathway Analysis ──────────────── */}
      {pathwayData && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
          {/* Target Role Match Score Card */}
          <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
            <CardBody>
              <Text fontSize="2xs" fontWeight="700" color="text.muted" textTransform="uppercase">
                Target Role Readiness
              </Text>
              <Flex align="baseline" gap={2} mt={1} mb={2}>
                <Heading size="lg" color={matchPercentage >= 70 ? "green.600" : matchPercentage >= 40 ? "orange.500" : "red.500"}>
                  {matchPercentage}%
                </Heading>
                <Text fontSize="xs" color="text.secondary">
                  Competency Fit
                </Text>
              </Flex>
              <Progress
                value={matchPercentage}
                size="sm"
                colorScheme={matchPercentage >= 70 ? "green" : matchPercentage >= 40 ? "orange" : "red"}
                borderRadius="full"
                mb={3}
              />
              <Text fontSize="2xs" color="text.muted">
                Based on required skills for <strong>{targetRole}</strong> in {primaryState} and preferred regions.
              </Text>
            </CardBody>
          </Card>

          {/* Skills Breakdown Card */}
          <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
            <CardBody>
              <Text fontSize="2xs" fontWeight="700" color="text.muted" textTransform="uppercase" mb={2}>
                Competency Breakdown
              </Text>
              <VStack align="stretch" spacing={2}>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="green.700">
                    Acquired ({skills.filter((s) => (pathwayData.requiredSkills || []).some((r) => r.toLowerCase() === s.toLowerCase())).length}):
                  </Text>
                  <Flex wrap="wrap" gap={1} mt={1}>
                    {skills.filter((s) => (pathwayData.requiredSkills || []).some((r) => r.toLowerCase() === s.toLowerCase())).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="green" size="sm" />
                    ))}
                  </Flex>
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="orange.600">
                    To Develop ({skillsToDevelop.length}):
                  </Text>
                  <Flex wrap="wrap" gap={1} mt={1}>
                    {skillsToDevelop.slice(0, 5).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="orange" size="sm" />
                    ))}
                    {skillsToDevelop.length > 5 && (
                      <Badge fontSize="2xs">+{skillsToDevelop.length - 5} more</Badge>
                    )}
                  </Flex>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Regional Trending Skills in Primary & Preferred States */}
          <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm" bg="#F8FAFC">
            <CardBody>
              <HStack spacing={1} mb={2}>
                <StarIcon color="brand.500" boxSize={3} />
                <Text fontSize="2xs" fontWeight="700" color="brand.500" textTransform="uppercase">
                  Regional In-Demand Skills ({primaryState})
                </Text>
              </HStack>
              <Text fontSize="xs" color="text.secondary" mb={2}>
                High market demand across employers in your selected states:
              </Text>
              <Flex wrap="wrap" gap={1.5}>
                {regionalTrending.map((item, i) => (
                  <Badge
                    key={i}
                    colorScheme="purple"
                    variant="solid"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                  >
                    {item.skill} ({item.demandCount} jobs)
                  </Badge>
                ))}
                {regionalTrending.length === 0 && (
                  <Text fontSize="xs" color="text.muted">
                    No state-specific demand spikes detected.
                  </Text>
                )}
              </Flex>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* ── Recommended Courses Table ────────────────────────────── */}
      {isLoading ? (
        <LoadingSpinner message="Querying regional course registry and calculating multi-state delivery options..." />
      ) : courses.length > 0 ? (
        <Box
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          boxShadow="sm"
          overflowX="auto"
        >
          <Box p={4} borderBottom="1px solid #E2E8F0">
            <Flex justify="space-between" align="center">
              <Box>
                <Heading as="h4" size="xs" fontWeight="700" textTransform="uppercase" color="brand.500">
                  Recommended Courses & Training Centers ({courses.length} Options)
                </Heading>
                <Text fontSize="xs" color="text.muted">
                  Filtered for {primaryState} & {preferredStates.join(", ")} | Delivery: {deliveryMode}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Course / Qualification</Th>
                <Th>Institute / Provider</Th>
                <Th>Location</Th>
                <Th>Mode</Th>
                <Th>Duration</Th>
                <Th>Skill Match %</Th>
                <Th>Matched Skills</Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => (
                <CourseRow key={course._id || course.courseId} course={course} />
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : targetRole ? (
        <EmptyState
          icon={SearchIcon}
          title={`No aligned courses found for "${targetRole}" in the selected states/mode`}
          description="Try broadening your delivery mode to 'All' or adding additional states to your preferences."
          actionLabel="Browse Full Course Catalog"
          onAction={() => window.location.assign("/trainee/courses")}
        />
      ) : null}
    </PageShell>
  );
};

export default PathwayFinder;
