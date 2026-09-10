import React, { useState } from "react";
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
} from "@chakra-ui/react";
import {
  EditIcon,
  AddIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  StarIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const InstituteDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Edit Profile Modal state
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  // Add Course Modal state
  const {
    isOpen: isAddCourseOpen,
    onOpen: onAddCourseOpen,
    onClose: onAddCourseClose,
  } = useDisclosure();

  // Form states for Institute Profile Edit
  const [profileForm, setProfileForm] = useState({
    name: "",
    state: "",
    district: "",
    address: "",
    languages: [],
    totalTrainers: 10,
    skillsCovered: [],
    contactEmail: "",
    contactPhone: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  // Form states for New Course
  const [courseForm, setCourseForm] = useState({
    courseName: "",
    sector: "Information Technology",
    nsqfLevel: 5,
    durationWeeks: 12,
    deliveryMode: "Hybrid",
    state: "",
    district: "",
    skills: [],
  });
  const [newCourseSkill, setNewCourseSkill] = useState("");

  // Fetch Institute Dashboard data
  const {
    data: dashData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["institute", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/institutes/me/dashboard");
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data?.institute) {
        setProfileForm({
          name: data.institute.name || "",
          state: data.institute.state || "",
          district: data.institute.district || "",
          address: data.institute.address || "",
          languages: data.institute.languages || ["English"],
          totalTrainers: data.institute.totalTrainers || 10,
          skillsCovered: data.institute.skillsCovered || [],
          contactEmail: data.institute.contactEmail || "",
          contactPhone: data.institute.contactPhone || "",
        });
        setCourseForm((prev) => ({
          ...prev,
          state: data.institute.state || "Kerala",
          district: data.institute.district || "Ernakulam",
        }));
      }
    },
  });

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const instituteId = dashData?.institute?._id;
      if (!instituteId) throw new Error("Institute ID not found");
      const res = await api.put(`/institutes/${instituteId}`, updatedData);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Institute details saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries(["institute", "dashboard"]);
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

  // Create Course Mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData) => {
      const res = await api.post("/courses", {
        ...courseData,
        instituteId: dashData?.institute?._id,
        provider: dashData?.institute?.name,
      });
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Course Added",
        description: "New course curriculum successfully registered in national directory.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries(["institute", "dashboard"]);
      onAddCourseClose();
      setCourseForm({
        courseName: "",
        sector: "Information Technology",
        nsqfLevel: 5,
        durationWeeks: 12,
        deliveryMode: "Hybrid",
        state: dashData?.institute?.state || "Kerala",
        district: dashData?.institute?.district || "Ernakulam",
        skills: [],
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to Add Course",
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
  const aiRecommendation = dashData?.aiRecommendation || "";
  const totalStateJobs = dashData?.totalStateJobs || 0;

  return (
    <PageShell
      role="institute"
      title="Training Institute & Capacity Portal"
      subtitle="Manage your training center profile, curriculum catalog, and evaluate regional market demand alignment"
      breadcrumbItems={[{ label: "Institute Portal" }]}
    >
      {/* ── Key Metrics Header ────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4} mb={6}>
        <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel fontSize="2xs" color="text.muted" textTransform="uppercase" fontWeight="700">
                Certified Trainers
              </StatLabel>
              <StatNumber color="brand.500" fontSize="2xl">
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
              <StatNumber color="blue.600" fontSize="2xl">
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
              <StatNumber color="green.600" fontSize="2xl">
                {totalStateJobs}
              </StatNumber>
              <StatHelpText fontSize="2xs">Active in {institute.state}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm">
          <CardBody>
            <Stat>
              <StatLabel fontSize="2xs" color="text.muted" textTransform="uppercase" fontWeight="700">
                Jurisdiction
              </StatLabel>
              <StatNumber color="purple.600" fontSize="lg" noOfLines={1}>
                {institute.state || "State"}
              </StatNumber>
              <StatHelpText fontSize="2xs">{institute.district || "District"}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* ── AI/ML Curriculum Alignment Directive ──────────────────── */}
      {aiRecommendation && (
        <Alert
          status="info"
          variant="left-accent"
          borderRadius="md"
          mb={6}
          borderLeftColor="#FF6B00"
          bg="orange.50"
          borderWidth="1px"
          borderColor="orange.200"
        >
          <AlertIcon color="#FF6B00" />
          <Box>
            <AlertTitle fontSize="sm" fontWeight="700" color="orange.900">
              AI Market-Curriculum Alignment Directive ({institute.state})
            </AlertTitle>
            <AlertDescription fontSize="xs" color="orange.800" mt={1}>
              {aiRecommendation}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* ── Institute Profile Card ────────────────────────────────── */}
      <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm" mb={6}>
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
            <Button
              size="sm"
              leftIcon={<EditIcon />}
              colorScheme="brand"
              variant="outline"
              onClick={onEditOpen}
            >
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

      {/* ── Regional Market Demand vs Institute Capability ─────────── */}
      <Card borderWidth="1px" borderColor="#E2E8F0" shadow="sm" mb={6} id="alignment">
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

      {/* ── Registered Courses Catalog ────────────────────────────── */}
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
            <Button
              size="sm"
              leftIcon={<AddIcon />}
              colorScheme="brand"
              onClick={onAddCourseOpen}
            >
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
                      {(c.skills || []).length > 3 && (
                        <Badge fontSize="2xs">+{c.skills.length - 3}</Badge>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {courses.length === 0 && (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={6}>
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

              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs">Total Trainers / Instructors</FormLabel>
                  <Input
                    type="number"
                    value={profileForm.totalTrainers}
                    onChange={(e) => setProfileForm({ ...profileForm, totalTrainers: Number(e.target.value) })}
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

      {/* ── Add Course Modal ───────────────────────────────────────── */}
      <Modal isOpen={isAddCourseOpen} onClose={onAddCourseClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md" fontWeight="700">
            Register New Course Offering
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
                  <Select
                    value={courseForm.sector}
                    onChange={(e) => setCourseForm({ ...courseForm, sector: e.target.value })}
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Hardware">Electronics & Hardware</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Renewable Energy">Renewable Energy</option>
                  </Select>
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
            <Button variant="ghost" mr={3} onClick={onAddCourseClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              isLoading={createCourseMutation.isLoading}
              onClick={() => {
                if (!courseForm.courseName.trim()) {
                  toast({
                    title: "Course Name Required",
                    status: "warning",
                    duration: 3000,
                  });
                  return;
                }
                createCourseMutation.mutate(courseForm);
              }}
            >
              Add Course
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
};

export default InstituteDashboard;
