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
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  useToast,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import {
  AddIcon,
  RepeatIcon,
  CheckCircleIcon,
  StarIcon,
  WarningIcon,
  InfoOutlineIcon,
} from "@chakra-ui/icons";
import PageShell from "../../components/layout/PageShell";
import SkillTag from "../../components/shared/SkillTag";
import StatCard from "../../components/shared/StatCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { useAuth } from "../../context/AuthContext";
import useSkillGap from "../../hooks/useSkillGap";
import api from "../../api/axios";

const SkillGap = () => {
  const { user } = useAuth();
  const {
    skillGapData,
    isLoading: isGapLoading,
    refetchSkillGap,
    updateSkills,
    isUpdating,
  } = useSkillGap();

  const [skillsList, setSkillsList] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Initialize skills from user profile or fetched gap data
  useEffect(() => {
    if (user?.skills && user.skills.length > 0) {
      setSkillsList(user.skills);
    } else if (skillGapData?.userSkills && skillGapData.userSkills.length > 0) {
      setSkillsList(skillGapData.userSkills);
    }
  }, [user?.skills, skillGapData?.userSkills]);

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Skill already added",
        description: `"${trimmed}" is already in your skills list.`,
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      setInputVal("");
      return;
    }

    setSkillsList([...skillsList, trimmed]);
    setInputVal("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSaveAndAnalyse = async () => {
    try {
      await updateSkills(skillsList);
      await refetchSkillGap();
      toast({
        title: "Skill Gap Analysis Updated",
        description: "Your skills have been saved and compared against national market trends.",
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
    } catch (err) {
      toast({
        title: "Analysis Failed",
        description: err.response?.data?.message || err.message || "Failed to update skills",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleViewCourseDetails = async (courseId) => {
    try {
      const res = await api.get(`/courses/${courseId}`);
      setSelectedCourse(res.data?.data || null);
      onOpen();
    } catch (err) {
      // If single course endpoint error, fallback to data item
      const fallback = skillGapData?.recommendedCourses?.find((c) => c.courseId === courseId);
      if (fallback) {
        setSelectedCourse(fallback);
        onOpen();
      } else {
        toast({
          title: "Could not load details",
          description: "Course detail retrieval failed.",
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  const userSkills = skillGapData?.userSkills || skillsList;
  const trendingSkills = skillGapData?.trendingSkills || [];
  const missingSkills = skillGapData?.missingSkills || [];
  const recommendedCourses = skillGapData?.recommendedCourses || [];

  return (
    <PageShell
      role="trainee"
      title="Trainee Skill Gap Analysis"
      subtitle="Benchmark your competencies against the top 20 national market skills and discover targeted gap-filling courses"
      breadcrumbItems={[{ label: "Skill Gap Analysis" }]}
    >
      {/* Step 1: Input Skills Card */}
      <Box
        bg="white"
        p={{ base: 5, md: 6 }}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        borderTop="4px solid #003580"
        boxShadow="sm"
        mb={8}
      >
        <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={2} mb={3}>
          <Box>
            <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
              Step 1 — What skills do you currently have?
            </Heading>
            <Text fontSize="xs" color="text.muted">
              Add all your vocational competencies, programming tools, or certifications. Press Enter after each.
            </Text>
          </Box>
          <Badge colorScheme="blue" fontSize="xs" px={2.5} py={1} borderRadius="full">
            {skillsList.length} Skills Registered
          </Badge>
        </Flex>

        {/* Input box */}
        <form onSubmit={handleAddSkill}>
          <Flex gap={2} mb={4}>
            <Input
              size="md"
              placeholder="e.g. React, Electrical Safety, Welding, Python, Machine Operation..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              bg="gray.50"
            />
            <Button
              type="button"
              onClick={handleAddSkill}
              colorScheme="brand"
              size="md"
              leftIcon={<AddIcon />}
              px={5}
            >
              Add
            </Button>
          </Flex>
        </form>

        {/* Current Skills Tag Box */}
        <Box
          p={3}
          minH="65px"
          bg="#F8FAFC"
          borderRadius="md"
          border="1px dashed #CBD5E1"
          mb={4}
        >
          {skillsList.length === 0 ? (
            <Text fontSize="xs" color="text.muted" fontStyle="italic">
              No skills added yet. Type your skills above or click common suggestions below.
            </Text>
          ) : (
            <Flex wrap="wrap" gap={1.5}>
              {skillsList.map((skill, idx) => (
                <SkillTag
                  key={idx}
                  skill={skill}
                  colorScheme="green"
                  removable={true}
                  onRemove={handleRemoveSkill}
                />
              ))}
            </Flex>
          )}
        </Box>

        {/* Popular Quick-Add Skills */}
        <HStack spacing={2} wrap="wrap" fontSize="xs" color="text.muted" mb={5}>
          <Text fontWeight="600">Quick Add:</Text>
          {["HTML", "CSS", "JavaScript", "React", "Python", "AutoCAD", "PLC", "Welding"].map((s) => (
            <Button
              key={s}
              size="xs"
              variant="outline"
              borderColor="#CBD5E1"
              onClick={() => {
                if (!skillsList.some((item) => item.toLowerCase() === s.toLowerCase())) {
                  setSkillsList([...skillsList, s]);
                }
              }}
            >
              +{s}
            </Button>
          ))}
        </HStack>

        <Flex justify="flex-end">
          <Button
            bg="#FF6B00"
            color="white"
            _hover={{ bg: "#e66000" }}
            size="md"
            px={8}
            fontWeight="700"
            onClick={handleSaveAndAnalyse}
            isLoading={isUpdating || isGapLoading}
            loadingText="Analyzing Market Gaps..."
            leftIcon={<RepeatIcon />}
          >
            Save & Analyse Skill Gap
          </Button>
        </Flex>
      </Box>

      {/* Step 2: Gap Analysis Results */}
      {isGapLoading ? (
        <LoadingSpinner message="Calculating national labor market trends and computing your skill gap..." />
      ) : (
        <Box mb={8}>
          <Box mb={4}>
            <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
              Step 2 — National Skill Gap Comparative Breakdown
            </Heading>
            <Text fontSize="xs" color="text.muted">
              Comparison between your profile and top 20 trending job skills across India
            </Text>
          </Box>

          {/* 3 Columns Side-by-Side */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
            {/* Column 1: Your Skills */}
            <Box
              bg="white"
              p={5}
              borderRadius="md"
              borderWidth="1px"
              borderColor="#E2E8F0"
              borderTop="4px solid #1A7F4B"
              boxShadow="sm"
            >
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Icon as={CheckCircleIcon} color="green.600" />
                  <Heading as="h4" size="xs" fontWeight="700" color="green.700" textTransform="uppercase">
                    Your Skills
                  </Heading>
                </HStack>
                <Badge colorScheme="green" fontSize="xs">
                  {userSkills.length}
                </Badge>
              </Flex>
              <Text fontSize="2xs" color="text.muted" mb={3}>
                Skills currently registered in your profile
              </Text>
              <Box minH="120px">
                <Flex wrap="wrap" gap={1.5}>
                  {userSkills.map((s, idx) => (
                    <SkillTag key={idx} skill={s} colorScheme="green" size="sm" />
                  ))}
                  {userSkills.length === 0 && (
                    <Text fontSize="xs" color="text.muted">
                      No skills recorded.
                    </Text>
                  )}
                </Flex>
              </Box>
            </Box>

            {/* Column 2: Trending Market Skills */}
            <Box
              bg="white"
              p={5}
              borderRadius="md"
              borderWidth="1px"
              borderColor="#E2E8F0"
              borderTop="4px solid #003580"
              boxShadow="sm"
            >
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Icon as={StarIcon} color="blue.600" />
                  <Heading as="h4" size="xs" fontWeight="700" color="blue.700" textTransform="uppercase">
                    Trending Market Skills
                  </Heading>
                </HStack>
                <Badge colorScheme="blue" fontSize="xs">
                  Top {trendingSkills.length || 20}
                </Badge>
              </Flex>
              <Text fontSize="2xs" color="text.muted" mb={3}>
                Aggregated from top active job listings
              </Text>
              <Box minH="120px">
                <Flex wrap="wrap" gap={1.5}>
                  {trendingSkills.map((s, idx) => (
                    <SkillTag key={idx} skill={s} colorScheme="blue" size="sm" />
                  ))}
                  {trendingSkills.length === 0 && (
                    <Text fontSize="xs" color="text.muted">
                      Trending skills indexing in progress.
                    </Text>
                  )}
                </Flex>
              </Box>
            </Box>

            {/* Column 3: Skill Gap */}
            <Box
              bg="white"
              p={5}
              borderRadius="md"
              borderWidth="1px"
              borderColor="#E2E8F0"
              borderTop="4px solid #C0392B"
              boxShadow="sm"
            >
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={2}>
                  <Icon as={WarningIcon} color="red.600" />
                  <Heading as="h4" size="xs" fontWeight="700" color="red.600" textTransform="uppercase">
                    Your Skill Gap
                  </Heading>
                </HStack>
                <Badge colorScheme="red" fontSize="xs">
                  {missingSkills.length} Missing
                </Badge>
              </Flex>
              <Text fontSize="2xs" color="text.muted" mb={3}>
                Trending market skills you haven't listed yet
              </Text>
              <Box minH="120px">
                <Flex wrap="wrap" gap={1.5}>
                  {missingSkills.map((s, idx) => (
                    <SkillTag key={idx} skill={s} colorScheme="red" size="sm" />
                  ))}
                  {missingSkills.length === 0 && (
                    <Text fontSize="xs" color="green.600" fontWeight="600">
                      Exceptional! You cover all top trending skills.
                    </Text>
                  )}
                </Flex>
              </Box>
            </Box>
          </SimpleGrid>

          {/* Section: Courses to Fill Your Gap */}
          <Box
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            borderColor="#E2E8F0"
            boxShadow="sm"
            overflowX="auto"
          >
            <Box p={5} borderBottom="1px solid #E2E8F0">
              <Heading as="h4" size="sm" fontWeight="700" color="text.primary">
                Curriculum Courses to Fill Your Skill Gap
              </Heading>
              <Text fontSize="xs" color="text.muted" mt={0.5}>
                Ranked by how many of your missing market skills are covered in the syllabus
              </Text>
            </Box>

            {recommendedCourses.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text fontSize="sm" color="text.secondary">
                  No courses found matching your specific missing skills, or you already have zero skill gap!
                </Text>
              </Box>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Course Name</Th>
                    <Th>Provider</Th>
                    <Th>Gap Skills Covered</Th>
                    <Th>District</Th>
                    <Th>Duration</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recommendedCourses.map((course) => (
                    <Tr key={course.courseId} _hover={{ bg: "gray.50" }}>
                      <Td fontWeight="600" color="text.primary">
                        {course.courseName}
                      </Td>
                      <Td color="text.secondary">{course.provider || "National Institute"}</Td>
                      <Td>
                        <HStack spacing={1} wrap="wrap">
                          {(course.gapSkillsCovered || []).map((s, idx) => (
                            <SkillTag key={idx} skill={s} colorScheme="orange" size="sm" />
                          ))}
                        </HStack>
                      </Td>
                      <Td>{course.district || "National"}</Td>
                      <Td>{course.durationWeeks ? `${course.durationWeeks} Weeks` : "8 Weeks"}</Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme="brand"
                          variant="outline"
                          onClick={() => handleViewCourseDetails(course.courseId)}
                        >
                          View Details
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </Box>
      )}

      {/* Course Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="brand.500" fontWeight="700" borderBottomWidth="1px">
            Course Curriculum Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={4}>
            {selectedCourse && (
              <VStack align="stretch" spacing={3} fontSize="sm">
                <Box>
                  <Heading as="h4" size="sm" color="text.primary">
                    {selectedCourse.courseName || selectedCourse.name}
                  </Heading>
                  <Text fontSize="xs" color="text.muted">
                    Provider: {selectedCourse.provider || "Government Training Institute"} | District: {selectedCourse.district || "Pan-India"}
                  </Text>
                </Box>

                <Divider borderColor="#E2E8F0" />

                <SimpleGrid columns={2} spacing={3} bg="#F8FAFC" p={3} borderRadius="md">
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      Duration
                    </Text>
                    <Text fontWeight="600">{selectedCourse.durationWeeks || 12} Weeks</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      NSQF Level
                    </Text>
                    <Text fontWeight="600">Level {selectedCourse.nsqfLevel || 4}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      Sector
                    </Text>
                    <Text fontWeight="600">{selectedCourse.sector || "IT & Technical"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      Placement Rate
                    </Text>
                    <Text fontWeight="600" color="green.600">
                      {selectedCourse.placementRate ? `${selectedCourse.placementRate}%` : "78%"}
                    </Text>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1}>
                    Full Curriculum Skills Taught:
                  </Text>
                  <Flex wrap="wrap" gap={1}>
                    {(selectedCourse.skills || selectedCourse.gapSkillsCovered || []).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="blue" size="sm" />
                    ))}
                  </Flex>
                </Box>

                {selectedCourse.recommendation && (
                  <Box p={3} bg="#fff0e5" borderRadius="md" borderLeft="3px solid #FF6B00">
                    <Text fontSize="2xs" fontWeight="700" color="#FF6B00" textTransform="uppercase">
                      Curriculum Recommendation
                    </Text>
                    <Text fontSize="xs" color="text.secondary" mt={1}>
                      {selectedCourse.recommendation}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px">
            <Button colorScheme="brand" size="sm" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageShell>
  );
};

export default SkillGap;
