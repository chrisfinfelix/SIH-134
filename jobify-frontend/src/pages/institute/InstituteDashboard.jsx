import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Flex,
  HStack,
  VStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Tag,
  TagLabel,
  TagCloseButton,
  useDisclosure,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  IconButton,
} from "@chakra-ui/react";
import {
  EditIcon,
  AddIcon,
  MinusIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  BellIcon,
  DeleteIcon,
  StarIcon,
} from "@chakra-ui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import PageShell from "../../components/layout/PageShell";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import SkillTag from "../../components/shared/SkillTag";
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

const TAB_KEYS = [
  "overview",
  "profile",
  "courses",
  "alignment",
  "placements",
  "notifications",
  "employer-feedback",
  "post-job",
];

const InstituteDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabIndex = Math.max(0, TAB_KEYS.indexOf(searchParams.get("tab") || "overview"));
  const handleTabChange = (idx) => {
    const key = TAB_KEYS[idx];
    if (key === "overview") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", key);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isAddCourseOpen, onOpen: onAddCourseOpen, onClose: onAddCourseClose } = useDisclosure();
  const { isOpen: isPostJobOpen, onOpen: onPostJobOpen, onClose: onPostJobClose } = useDisclosure();

  const [editingCourseId, setEditingCourseId] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    state: "",
    district: "",
    address: "",
    languages: [],
    totalTrainers: 10,
    numberOfEmployees: 0,
    skillsCovered: [],
    contactEmail: "",
    contactPhone: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  const emptyCourseForm = {
    courseName: "",
    sector: "Information Technology",
    nsqfLevel: 5,
    durationWeeks: 12,
    deliveryMode: "Hybrid",
    state: "",
    district: "",
    skills: [],
  };
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [newCourseSkill, setNewCourseSkill] = useState("");

  const [jobForm, setJobForm] = useState({ title: "", description: "", skills: [], salaryRange: "" });
  const [newJobSkill, setNewJobSkill] = useState("");

  // Fetch Institute Dashboard data
  const {
    data: dashData,
    isLoading,
  } = useQuery({
    queryKey: ["institute", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/institutes/me/dashboard");
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (dashData?.institute) {
      setProfileForm({
        name: dashData.institute.name || "",
        state: dashData.institute.state || "",
        district: dashData.institute.district || "",
        address: dashData.institute.address || "",
        languages: dashData.institute.languages || ["English"],
        totalTrainers: dashData.institute.totalTrainers || 10,
        numberOfEmployees: dashData.institute.numberOfEmployees || 0,
        skillsCovered: dashData.institute.skillsCovered || [],
        contactEmail: dashData.institute.contactEmail || "",
        contactPhone: dashData.institute.contactPhone || "",
      });
      setCourseForm((prev) => ({
        ...prev,
        state: dashData.institute.state || prev.state,
        district: dashData.institute.district || prev.district,
      }));
    }
  }, [dashData?.institute]);

  const instituteId = dashData?.institute?._id;

  // Notifications
  const { data: notificationData } = useQuery({
    queryKey: ["institute", "notifications", instituteId],
    queryFn: async () => {
      const res = await api.get(`/notifications/institute/${instituteId}`);
      return res.data;
    },
    enabled: !!instituteId,
  });
  const notifications = notificationData?.data || [];
  const unreadCount = notificationData?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: async (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["institute", "notifications", instituteId] }),
  });

  // Employer validation feedback — a separate channel from government notifications
  const { data: employerFeedbackData } = useQuery({
    queryKey: ["institute", "employer-feedback", instituteId],
    queryFn: async () => {
      const res = await api.get(`/employer-feedback/institute/${instituteId}`);
      return res.data;
    },
    enabled: !!instituteId,
  });
  const employerFeedback = employerFeedbackData?.data || [];
  const unreadFeedbackCount = employerFeedbackData?.unreadCount || 0;

  const markFeedbackReadMutation = useMutation({
    mutationFn: async (id) => api.patch(`/employer-feedback/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["institute", "employer-feedback", instituteId] }),
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      if (!instituteId) throw new Error("Institute ID not found");
      const res = await api.put(`/institutes/${instituteId}`, updatedData);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", status: "success", duration: 3000, isClosable: true });
      queryClient.invalidateQueries({ queryKey: ["institute", "dashboard"] });
      onEditClose();
    },
    onError: (err) => {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  // Adjust Number of Employees Mutation (quick +/- from the Overview card)
  const adjustEmployeesMutation = useMutation({
    mutationFn: async (delta) => {
      if (!instituteId) throw new Error("Institute ID not found");
      const nextCount = Math.max(0, (institute.numberOfEmployees || 0) + delta);
      const res = await api.put(`/institutes/${instituteId}`, { numberOfEmployees: nextCount });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institute", "dashboard"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to Update Employee Count",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  // Create / Update Course Mutation
  const saveCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      if (editingCourseId) {
        const res = await api.put(`/courses/${editingCourseId}`, courseData);
        return res.data;
      }
      const res = await api.post("/courses", {
        ...courseData,
        instituteId,
        provider: dashData?.institute?.name,
      });
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: editingCourseId ? "Course Updated" : "Course Added",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["institute", "dashboard"] });
      onAddCourseClose();
      setEditingCourseId(null);
      setCourseForm({
        ...emptyCourseForm,
        state: dashData?.institute?.state || "",
        district: dashData?.institute?.district || "",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to Save Course",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      toast({ title: "Course Removed", status: "success", duration: 2500, isClosable: true });
      queryClient.invalidateQueries({ queryKey: ["institute", "dashboard"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to Remove Course",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const postJobMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/institutes/${instituteId}/post-job`, data);
      return res.data;
    },
    onSuccess: (res) => {
      toast({
        title: "Job Posting Saved",
        description: res.message || "Automated listing to external job boards is coming soon.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      onPostJobClose();
      setJobForm({ title: "", description: "", skills: [], salaryRange: "" });
    },
    onError: (err) => {
      toast({
        title: "Failed to Post Job",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  if (isLoading) {
    return (
      <PageShell role="institute" title="Institute Management Portal">
        <LoadingSpinner message="Loading institute profile and regional demand intelligence..." />
      </PageShell>
    );
  }

  const institute = dashData?.institute || {};
  const courses = dashData?.courses || [];
  const marketComparison = dashData?.marketComparison || [];
  const recommendation = dashData?.recommendation || "";
  const totalStateJobs = dashData?.totalStateJobs || 0;
  const placementOutcomes = dashData?.placementOutcomes || [];

  const openEditCourse = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      courseName: course.courseName || "",
      sector: course.sector || "Information Technology",
      nsqfLevel: course.nsqfLevel || 5,
      durationWeeks: course.durationWeeks || 12,
      deliveryMode: course.deliveryMode || "Hybrid",
      state: course.state || institute.state || "",
      district: course.district || institute.district || "",
      skills: course.skills || [],
    });
    onAddCourseOpen();
  };

  const openAddCourse = () => {
    setEditingCourseId(null);
    setCourseForm({
      ...emptyCourseForm,
      state: institute.state || "",
      district: institute.district || "",
    });
    onAddCourseOpen();
  };

  return (
    <PageShell
      role="institute"
      title="Training Institute & Capacity Portal"
      subtitle="Manage your training center profile, curriculum catalog, and evaluate regional market demand alignment"
      breadcrumbItems={[{ label: "Institute Portal" }]}
    >
      <Tabs index={tabIndex} onChange={handleTabChange} colorScheme="brand" variant="enclosed">
        <TabList overflowX="auto" overflowY="hidden" whiteSpace="nowrap">
          <Tab>Overview</Tab>
          <Tab>Profile</Tab>
          <Tab>Courses</Tab>
          <Tab>Market Alignment</Tab>
          <Tab>Placement Outcomes</Tab>
          <Tab>
            Notifications
            {unreadCount > 0 && (
              <Badge ml={2} colorScheme="red" borderRadius="full">
                {unreadCount}
              </Badge>
            )}
          </Tab>
          <Tab>
            Employer Feedback
            {unreadFeedbackCount > 0 && (
              <Badge ml={2} colorScheme="red" borderRadius="full">
                {unreadFeedbackCount}
              </Badge>
            )}
          </Tab>
          <Tab>Post a Job</Tab>
        </TabList>

        <TabPanels>
          {/* ── Overview ─────────────────────────────────────────── */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4} mb={6}>
              <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel fontSize="2xs" color="text.muted" textTransform="uppercase" fontWeight="700">
                      Number of Employees
                    </StatLabel>
                    <Flex align="center" justify="space-between" mt={1}>
                      <StatNumber color="brand.500" fontSize="2xl">
                        {institute.numberOfEmployees || 0}
                      </StatNumber>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Decrease number of employees"
                          icon={<MinusIcon boxSize={2.5} />}
                          size="xs"
                          variant="outline"
                          colorScheme="brand"
                          isDisabled={(institute.numberOfEmployees || 0) <= 0}
                          isLoading={adjustEmployeesMutation.isLoading}
                          onClick={() => adjustEmployeesMutation.mutate(-1)}
                        />
                        <IconButton
                          aria-label="Increase number of employees"
                          icon={<AddIcon boxSize={2.5} />}
                          size="xs"
                          colorScheme="brand"
                          isLoading={adjustEmployeesMutation.isLoading}
                          onClick={() => adjustEmployeesMutation.mutate(1)}
                        />
                      </HStack>
                    </Flex>
                    <StatHelpText fontSize="2xs">Total Institute Staff</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel fontSize="2xs" color="text.muted" textTransform="uppercase" fontWeight="700">
                      Certified Trainers
                    </StatLabel>
                    <StatNumber color="blue.600" fontSize="2xl">
                      {institute.totalTrainers || 0}
                    </StatNumber>
                    <StatHelpText fontSize="2xs">Active Faculty & Instructors</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel fontSize="2xs" color="text.muted" textTransform="uppercase" fontWeight="700">
                      Active Courses
                    </StatLabel>
                    <StatNumber color="green.600" fontSize="2xl">
                      {courses.length}
                    </StatNumber>
                    <StatHelpText fontSize="2xs">Registered Curriculum Tracks</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
                <CardBody>
                  <Stat>
                    <StatLabel fontSize="2xs" color="text.muted" textTransform="uppercase" fontWeight="700">
                      Regional Job Openings
                    </StatLabel>
                    <StatNumber color="purple.600" fontSize="2xl">
                      {totalStateJobs}
                    </StatNumber>
                    <StatHelpText fontSize="2xs">Active in {institute.state}</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>

            {recommendation && (
              <Alert
                status="info"
                variant="left-accent"
                borderRadius="md"
                mb={2}
                borderLeftColor="#FF6B00"
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.200"
              >
                <AlertIcon color="#FF6B00" />
                <Box>
                  <AlertTitle fontSize="sm" fontWeight="700" color="orange.900">
                    Market-Curriculum Alignment Summary ({institute.state})
                  </AlertTitle>
                  <AlertDescription fontSize="xs" color="orange.800" mt={1}>
                    {recommendation}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </TabPanel>

          {/* ── Profile ──────────────────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <HStack spacing={2}>
                      <Heading size="md" color="text.primary">
                        {institute.name}
                      </Heading>
                      <Badge colorScheme="green" variant="solid" fontSize="2xs" px={2} py={0.5} borderRadius="sm">
                        VERIFIED INSTITUTE
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="text.muted" mt={1}>
                      {institute.address || "Official State Skill Training Partner"}
                    </Text>
                  </Box>
                  <Button size="sm" leftIcon={<EditIcon />} colorScheme="brand" variant="outline" onClick={onEditOpen}>
                    Edit Profile
                  </Button>
                </Flex>
              </CardHeader>
              <Divider borderColor="#E2E8F0" />
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="text.secondary" textTransform="uppercase" mb={1}>
                      Location & Jurisdiction
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {institute.district}, {institute.state}
                    </Text>
                    <Text fontSize="xs" color="text.muted" mt={1}>
                      Address: {institute.address || "Main Campus"}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="text.secondary" textTransform="uppercase" mb={1}>
                      Languages Taught
                    </Text>
                    <Flex wrap="wrap" gap={1.5}>
                      {(institute.languages || ["English"]).map((lang) => (
                        <Badge key={lang} colorScheme="blue" variant="subtle" fontSize="2xs">
                          {lang}
                        </Badge>
                      ))}
                    </Flex>
                    <Text fontSize="xs" color="text.muted" mt={2}>
                      Contact: {institute.contactEmail || user?.email} | {institute.contactPhone || "+91 (N/A)"}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="text.secondary" textTransform="uppercase" mb={1}>
                      Core Faculty Skills Covered
                    </Text>
                    <Flex wrap="wrap" gap={1.5}>
                      {(institute.skillsCovered || []).map((sk) => (
                        <SkillTag key={sk} skill={sk} colorScheme="orange" size="sm" />
                      ))}
                      {(institute.skillsCovered || []).length === 0 && (
                        <Text fontSize="xs" color="text.muted">
                          No faculty skills registered.
                        </Text>
                      )}
                    </Flex>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ── Courses ──────────────────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="text.primary">
                      Institute Course Catalog & Offerings ({courses.length})
                    </Heading>
                    <Text fontSize="xs" color="text.muted">
                      Courses officially offered and recognized by the state skill registry
                    </Text>
                  </Box>
                  <Button size="sm" leftIcon={<AddIcon />} colorScheme="brand" onClick={openAddCourse}>
                    Add New Course
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Course Name</Th>
                      <Th>Sector</Th>
                      <Th>NSQF Level</Th>
                      <Th>Mode</Th>
                      <Th>Duration</Th>
                      <Th>Target Skills</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {courses.map((c) => (
                      <Tr key={c._id}>
                        <Td fontWeight="600" color="brand.600">
                          {c.courseName}
                        </Td>
                        <Td>{c.sector || "General"}</Td>
                        <Td>
                          <Badge colorScheme="blue" variant="outline">
                            Level {c.nsqfLevel || 4}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={c.deliveryMode === "Online" ? "teal" : c.deliveryMode === "Offline" ? "purple" : "blue"}
                            fontSize="2xs"
                          >
                            {c.deliveryMode || "Hybrid"}
                          </Badge>
                        </Td>
                        <Td>{c.durationWeeks ? `${c.durationWeeks} wks` : "12 wks"}</Td>
                        <Td>
                          <HStack spacing={1} wrap="wrap">
                            {(c.skills || []).slice(0, 3).map((s, i) => (
                              <SkillTag key={i} skill={s} colorScheme="green" size="sm" />
                            ))}
                            {(c.skills || []).length > 3 && <Badge fontSize="2xs">+{c.skills.length - 3}</Badge>}
                          </HStack>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Edit course"
                              icon={<EditIcon />}
                              size="xs"
                              variant="outline"
                              onClick={() => openEditCourse(c)}
                            />
                            <IconButton
                              aria-label="Delete course"
                              icon={<DeleteIcon />}
                              size="xs"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => deleteCourseMutation.mutate(c._id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                    {courses.length === 0 && (
                      <Tr>
                        <Td colSpan={7} textAlign="center" py={6}>
                          <EmptyState
                            icon={InfoIcon}
                            title="No Courses Registered Yet"
                            description="Click 'Add New Course' to add your institute's curriculum offerings."
                          />
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ── Market Alignment ─────────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="text.primary">
                      Regional Market Demand vs Institute Skills Alignment ({institute.state})
                    </Heading>
                    <Text fontSize="xs" color="text.muted">
                      Comparing top employer skill demand signals in {institute.state} against your institute's offerings
                    </Text>
                  </Box>
                  <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="full">
                    {marketComparison.length} In-Demand Skills Tracked
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>High-Demand Skill</Th>
                      <Th>Regional Employer Demand</Th>
                      <Th>Institute Capability Status</Th>
                      <Th>Action Recommendation</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {marketComparison.map((item, idx) => {
                      const isAvailable = item.status === "Available";
                      return (
                        <Tr key={idx}>
                          <Td fontWeight="600">{item.skill}</Td>
                          <Td>
                            <Badge colorScheme="purple" variant="solid" fontSize="xs">
                              {item.demandCount} active postings
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={isAvailable ? "green" : "red"} variant="subtle" fontSize="2xs" px={2} py={0.5}>
                              {isAvailable ? "✓ Available in Institute" : "✕ Not Available"}
                            </Badge>
                          </Td>
                          <Td fontSize="xs" color={isAvailable ? "green.700" : "red.600"} fontWeight="500">
                            {isAvailable
                              ? "Curriculum well aligned with regional market."
                              : "High priority: Introduce NSQF-aligned module."}
                          </Td>
                        </Tr>
                      );
                    })}
                    {marketComparison.length === 0 && (
                      <Tr>
                        <Td colSpan={4} textAlign="center" py={4} color="text.muted">
                          No regional job demand signals found for {institute.state} yet.
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* ── Placement Outcomes ───────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <Heading size="sm" color="text.primary">
                  Course Placement Outcomes
                </Heading>
                <Text fontSize="xs" color="text.muted" mt={1}>
                  Recorded placement rates for your institute's courses across the years on file
                </Text>
              </CardHeader>
              <CardBody pt={2}>
                {placementOutcomes.length === 0 ? (
                  <EmptyState
                    icon={StarIcon}
                    title="No placement data recorded yet"
                    description="Placement outcomes will appear here once results are recorded for your courses."
                  />
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Course Name</Th>
                        <Th>Latest Placement Rate</Th>
                        <Th>Average (All Years)</Th>
                        <Th>Year-by-Year History</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {placementOutcomes.map((p) => (
                        <Tr key={p.courseId}>
                          <Td fontWeight="600" color="brand.600">
                            {p.courseName}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={p.latestPlacementPercent >= 70 ? "green" : p.latestPlacementPercent >= 40 ? "orange" : "red"}
                              fontSize="sm"
                              px={2.5}
                              py={0.5}
                              borderRadius="full"
                            >
                              {p.latestPlacementPercent}% ({p.latestYear})
                            </Badge>
                          </Td>
                          <Td fontWeight="600">{p.avgPlacementPercent}%</Td>
                          <Td>
                            <HStack spacing={1} wrap="wrap">
                              {p.history.map((h, i) => (
                                <Badge key={i} variant="outline" colorScheme="blue" fontSize="2xs">
                                  {h.year}: {h.placementPercent}%
                                </Badge>
                              ))}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* ── Notifications ────────────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <BellIcon color="brand.500" />
                  <Heading size="sm" color="text.primary">
                    Curriculum Update Notifications
                  </Heading>
                </HStack>
                <Text fontSize="xs" color="text.muted" mt={1}>
                  Messages from government/state authorities and automatic alerts for flagged courses
                </Text>
              </CardHeader>
              <CardBody pt={2}>
                {notifications.length === 0 ? (
                  <EmptyState
                    icon={BellIcon}
                    title="No notifications yet"
                    description="You'll see curriculum-update alerts here when a course needs attention."
                  />
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {notifications.map((n) => (
                      <Box
                        key={n._id}
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={n.read ? "#E2E8F0" : "#FF6B00"}
                        bg={n.read ? "white" : "#fff8f2"}
                      >
                        <Flex justify="space-between" align="flex-start" gap={2}>
                          <Box>
                            <HStack spacing={2} mb={1}>
                              <Badge colorScheme={n.type === "auto_gap_alert" ? "red" : "blue"} fontSize="2xs">
                                {n.type === "auto_gap_alert" ? "Auto Gap Alert" : "Government Message"}
                              </Badge>
                              {n.courseId?.courseName && (
                                <Text fontSize="2xs" color="text.muted">
                                  Course: {n.courseId.courseName}
                                </Text>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="text.primary">
                              {n.message}
                            </Text>
                            <Text fontSize="2xs" color="text.muted" mt={1}>
                              {new Date(n.createdAt).toLocaleString()}
                            </Text>
                          </Box>
                          {!n.read && (
                            <Button size="xs" variant="outline" onClick={() => markReadMutation.mutate(n._id)}>
                              Mark Read
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* ── Employer Feedback ────────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <HStack spacing={2}>
                  <EditIcon color="brand.500" />
                  <Heading size="sm" color="text.primary">
                    Employer Course Validation Feedback
                  </Heading>
                </HStack>
                <Text fontSize="xs" color="text.muted" mt={1}>
                  Feedback from industry employers who validated your courses against real job requirements —
                  kept separate from government curriculum-update notifications.
                </Text>
              </CardHeader>
              <CardBody pt={2}>
                {employerFeedback.length === 0 ? (
                  <EmptyState
                    icon={EditIcon}
                    title="No employer feedback yet"
                    description="When an employer validates one of your courses, their feedback will appear here."
                  />
                ) : (
                  <VStack align="stretch" spacing={3}>
                    {employerFeedback.map((f) => (
                      <Box
                        key={f._id}
                        p={4}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={f.read ? "#E2E8F0" : "#003580"}
                        bg={f.read ? "white" : "#eef3fa"}
                      >
                        <Flex justify="space-between" align="flex-start" gap={2}>
                          <Box>
                            <HStack spacing={2} mb={1}>
                              <Badge
                                colorScheme={
                                  f.status === "approved" ? "green" : f.status === "rejected" ? "red" : "orange"
                                }
                                fontSize="2xs"
                                textTransform="uppercase"
                              >
                                {f.status.replace("_", " ")}
                              </Badge>
                              {f.courseId?.courseName && (
                                <Text fontSize="2xs" color="text.muted">
                                  Course: {f.courseId.courseName}
                                </Text>
                              )}
                            </HStack>
                            {f.comment && (
                              <Text fontSize="sm" color="text.primary">
                                {f.comment}
                              </Text>
                            )}
                            {(f.validatedSkills || []).length > 0 && (
                              <HStack spacing={1} wrap="wrap" mt={1}>
                                {f.validatedSkills.map((s, i) => (
                                  <SkillTag key={i} skill={s} colorScheme="blue" size="sm" />
                                ))}
                              </HStack>
                            )}
                            <Text fontSize="2xs" color="text.muted" mt={1}>
                              From: {f.employerId?.organization || f.employerId?.name || "An Employer"} ·{" "}
                              {new Date(f.createdAt).toLocaleString()}
                            </Text>
                          </Box>
                          {!f.read && (
                            <Button size="xs" variant="outline" onClick={() => markFeedbackReadMutation.mutate(f._id)}>
                              Mark Read
                            </Button>
                          )}
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* ── Post a Job ───────────────────────────────────────── */}
          <TabPanel px={0}>
            <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="sm" color="text.primary">
                      Post a Job Opening
                    </Heading>
                    <Text fontSize="xs" color="text.muted">
                      Submit a job posting for your institute. Automated listing to external job boards is coming soon.
                    </Text>
                  </Box>
                  <Button size="sm" leftIcon={<AddIcon />} colorScheme="brand" onClick={onPostJobOpen}>
                    New Job Posting
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <Alert status="info" borderRadius="md" fontSize="xs">
                  <AlertIcon />
                  Postings you submit here are saved to the national job directory immediately. Automatic
                  publishing to external job boards will be added in a future release.
                </Alert>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ── Edit Profile Modal ─────────────────────────────────────── */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md" fontWeight="700">
            Edit Institute Profile
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">Institute / Center Name</FormLabel>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">State</FormLabel>
                  <Select
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">District</FormLabel>
                  <Input
                    value={profileForm.district}
                    onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="xs">Campus Address</FormLabel>
                <Input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={3} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs">Total Trainers / Instructors</FormLabel>
                  <Input
                    type="number"
                    value={profileForm.totalTrainers}
                    onChange={(e) => setProfileForm({ ...profileForm, totalTrainers: Number(e.target.value) })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">Number of Employees</FormLabel>
                  <Input
                    type="number"
                    value={profileForm.numberOfEmployees}
                    onChange={(e) => setProfileForm({ ...profileForm, numberOfEmployees: Number(e.target.value) })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">Contact Phone</FormLabel>
                  <Input
                    value={profileForm.contactPhone}
                    onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                  />
                </FormControl>
              </SimpleGrid>

              {/* Skills Covered */}
              <FormControl>
                <FormLabel fontSize="xs">Faculty Competencies & Skills Covered</FormLabel>
                <Flex gap={2} mb={2}>
                  <Input
                    size="sm"
                    placeholder="Type skill name & add"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newSkill.trim() && !profileForm.skillsCovered.includes(newSkill.trim())) {
                        setProfileForm({
                          ...profileForm,
                          skillsCovered: [...profileForm.skillsCovered, newSkill.trim()],
                        });
                        setNewSkill("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </Flex>
                <Flex wrap="wrap" gap={1.5}>
                  {profileForm.skillsCovered.map((sk) => (
                    <Tag key={sk} size="sm" colorScheme="orange">
                      <TagLabel>{sk}</TagLabel>
                      <TagCloseButton
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            skillsCovered: profileForm.skillsCovered.filter((s) => s !== sk),
                          })
                        }
                      />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>

              {/* Languages */}
              <FormControl>
                <FormLabel fontSize="xs">Languages of Instruction</FormLabel>
                <Flex gap={2} mb={2}>
                  <Input
                    size="sm"
                    placeholder="e.g. English, Malayalam, Hindi"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newLang.trim() && !profileForm.languages.includes(newLang.trim())) {
                        setProfileForm({
                          ...profileForm,
                          languages: [...profileForm.languages, newLang.trim()],
                        });
                        setNewLang("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </Flex>
                <Flex wrap="wrap" gap={1.5}>
                  {profileForm.languages.map((lang) => (
                    <Tag key={lang} size="sm" colorScheme="blue">
                      <TagLabel>{lang}</TagLabel>
                      <TagCloseButton
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            languages: profileForm.languages.filter((l) => l !== lang),
                          })
                        }
                      />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={updateProfileMutation.isLoading}
              onClick={() => updateProfileMutation.mutate(profileForm)}
            >
              Save Profile
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Add/Edit Course Modal ──────────────────────────────────── */}
      <Modal
        isOpen={isAddCourseOpen}
        onClose={() => {
          setEditingCourseId(null);
          onAddCourseClose();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md" fontWeight="700">
            {editingCourseId ? "Edit Course Offering" : "Register New Course Offering"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">Course / Qualification Name</FormLabel>
                <Input
                  placeholder="e.g. Certificate in Full Stack Cloud Application Development"
                  value={courseForm.courseName}
                  onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Sector</FormLabel>
                  <Input
                    placeholder="e.g. Information Technology"
                    value={courseForm.sector}
                    onChange={(e) => setCourseForm({ ...courseForm, sector: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Delivery Mode</FormLabel>
                  <Select
                    value={courseForm.deliveryMode}
                    onChange={(e) => setCourseForm({ ...courseForm, deliveryMode: e.target.value })}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs">NSQF Level (1 - 8)</FormLabel>
                  <Select
                    value={courseForm.nsqfLevel}
                    onChange={(e) => setCourseForm({ ...courseForm, nsqfLevel: Number(e.target.value) })}
                  >
                    {[3, 4, 5, 6, 7].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Level {lvl}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs">Duration (Weeks)</FormLabel>
                  <Input
                    type="number"
                    value={courseForm.durationWeeks}
                    onChange={(e) => setCourseForm({ ...courseForm, durationWeeks: Number(e.target.value) })}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="xs">Target Skills Taught in this Course</FormLabel>
                <Flex gap={2} mb={2}>
                  <Input
                    size="sm"
                    placeholder="e.g. React, Node.js, Python"
                    value={newCourseSkill}
                    onChange={(e) => setNewCourseSkill(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newCourseSkill.trim() && !courseForm.skills.includes(newCourseSkill.trim())) {
                        setCourseForm({
                          ...courseForm,
                          skills: [...courseForm.skills, newCourseSkill.trim()],
                        });
                        setNewCourseSkill("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </Flex>
                <Flex wrap="wrap" gap={1.5}>
                  {courseForm.skills.map((sk) => (
                    <Tag key={sk} size="sm" colorScheme="green">
                      <TagLabel>{sk}</TagLabel>
                      <TagCloseButton
                        onClick={() =>
                          setCourseForm({
                            ...courseForm,
                            skills: courseForm.skills.filter((s) => s !== sk),
                          })
                        }
                      />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setEditingCourseId(null);
                onAddCourseClose();
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={saveCourseMutation.isLoading}
              onClick={() => {
                if (!courseForm.courseName.trim()) {
                  toast({ title: "Course Name Required", status: "warning", duration: 3000 });
                  return;
                }
                saveCourseMutation.mutate(courseForm);
              }}
            >
              {editingCourseId ? "Save Changes" : "Add Course"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Post a Job Modal ───────────────────────────────────────── */}
      <Modal isOpen={isPostJobOpen} onClose={onPostJobClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md" fontWeight="700">
            Post a Job Opening
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs">Job Title</FormLabel>
                <Input
                  placeholder="e.g. Junior Full Stack Developer"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Job Description</FormLabel>
                <Textarea
                  placeholder="Role responsibilities, eligibility, location..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Salary Range</FormLabel>
                <Input
                  placeholder="e.g. ₹2.5 - 4 LPA"
                  value={jobForm.salaryRange}
                  onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs">Required Skills</FormLabel>
                <Flex gap={2} mb={2}>
                  <Input
                    size="sm"
                    placeholder="e.g. React, SQL"
                    value={newJobSkill}
                    onChange={(e) => setNewJobSkill(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (newJobSkill.trim() && !jobForm.skills.includes(newJobSkill.trim())) {
                        setJobForm({ ...jobForm, skills: [...jobForm.skills, newJobSkill.trim()] });
                        setNewJobSkill("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </Flex>
                <Flex wrap="wrap" gap={1.5}>
                  {jobForm.skills.map((sk) => (
                    <Tag key={sk} size="sm" colorScheme="green">
                      <TagLabel>{sk}</TagLabel>
                      <TagCloseButton
                        onClick={() => setJobForm({ ...jobForm, skills: jobForm.skills.filter((s) => s !== sk) })}
                      />
                    </Tag>
                  ))}
                </Flex>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPostJobClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={postJobMutation.isLoading}
              onClick={() => {
                if (!jobForm.title.trim() || !jobForm.description.trim()) {
                  toast({ title: "Title and description are required", status: "warning", duration: 3000 });
                  return;
                }
                postJobMutation.mutate(jobForm);
              }}
            >
              Post Job
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
};

export default InstituteDashboard;
