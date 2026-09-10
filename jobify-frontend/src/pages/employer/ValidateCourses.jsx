import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  Textarea,
  Checkbox,
  CheckboxGroup,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  useDisclosure,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { CheckCircleIcon, EditIcon, StarIcon } from "@chakra-ui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatusBadge from "../../components/shared/StatusBadge";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";

const ValidateCourses = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [status, setStatus] = useState("approved");
  const [comment, setComment] = useState("");
  const [validatedSkills, setValidatedSkills] = useState([]);

  // Fetch courses to review
  const { data: coursesResult, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["courses", "all"],
    queryFn: async () => {
      const res = await api.get("/courses?limit=50");
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    },
  });

  // Fetch employer's own validations
  const { data: myValidations = [], isLoading: isValidationsLoading } = useQuery({
    queryKey: ["employer", "validations"],
    queryFn: async () => {
      const res = await api.get("/employer/validations");
      return res.data?.data || [];
    },
  });

  // Mutation for submitting validation
  const validationMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/employer/validate", payload);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Validation Submitted",
        description: "Your curriculum evaluation has been officially recorded.",
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["employer", "validations"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Submission Failed",
        description: err.response?.data?.message || err.message || "Could not save validation",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const handleOpenReview = (course) => {
    setSelectedCourse(course);
    setStatus("approved");
    setComment("");
    setValidatedSkills(course.skills || []);
    onOpen();
  };

  const handleSubmitValidation = (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    validationMutation.mutate({
      courseId: selectedCourse._id || selectedCourse.id,
      status: status.toLowerCase(),
      comment,
      validatedSkills,
    });
  };

  const courses = Array.isArray(coursesResult) ? coursesResult : [];

  return (
    <PageShell
      role="employer"
      title="Curriculum Validation Portal"
      subtitle="Evaluate vocational training courses against real industry demand and provide accredited feedback"
      breadcrumbItems={[{ label: "Course Validation" }]}
    >
      <Box bg="white" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0" boxShadow="sm">
        <Tabs colorScheme="brand" isLazy>
          <TabList px={4} pt={3} borderBottomColor="#E2E8F0">
            <Tab fontWeight="600" fontSize="sm">
              Pending Review ({courses.length})
            </Tab>
            <Tab fontWeight="600" fontSize="sm">
              My Submissions ({myValidations.length})
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Pending Courses */}
            <TabPanel p={4}>
              {isCoursesLoading ? (
                <LoadingSpinner message="Fetching courses awaiting validation..." />
              ) : courses.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Course Name</Th>
                        <Th>Sector</Th>
                        <Th>District</Th>
                        <Th>Skills Covered</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {courses.map((course) => (
                        <Tr key={course._id || course.id} _hover={{ bg: "gray.50" }}>
                          <Td fontWeight="600" color="text.primary">
                            {course.courseName || course.name}
                          </Td>
                          <Td fontSize="xs" color="text.secondary">
                            {course.sector || "Technical"}
                          </Td>
                          <Td fontSize="xs">{course.district || "Pan-India"}</Td>
                          <Td maxW="280px">
                            <Flex wrap="wrap" gap={1}>
                              {(course.skills || []).slice(0, 3).map((s, idx) => (
                                <SkillTag key={idx} skill={s} colorScheme="blue" size="sm" />
                              ))}
                              {(course.skills || []).length > 3 && (
                                <Text fontSize="2xs" color="text.muted" alignSelf="center">
                                  +{course.skills.length - 3} more
                                </Text>
                              )}
                            </Flex>
                          </Td>
                          <Td>
                            <Button
                              size="xs"
                              colorScheme="brand"
                              leftIcon={<EditIcon />}
                              onClick={() => handleOpenReview(course)}
                            >
                              Review
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <EmptyState
                  icon={CheckCircleIcon}
                  title="No courses pending review"
                  description="All available vocational courses have been reviewed."
                />
              )}
            </TabPanel>

            {/* Tab 2: My Validations */}
            <TabPanel p={4}>
              {isValidationsLoading ? (
                <LoadingSpinner message="Loading your past validations..." />
              ) : myValidations.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Course Name</Th>
                        <Th>Status</Th>
                        <Th>Comment / Feedback</Th>
                        <Th>Validated Skills</Th>
                        <Th>Date</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {myValidations.map((v, idx) => (
                        <Tr key={v._id || idx} _hover={{ bg: "gray.50" }}>
                          <Td fontWeight="600" color="text.primary">
                            {v.course?.courseName || v.courseName || "Vocational Course"}
                          </Td>
                          <Td>
                            <StatusBadge flag={v.status} />
                          </Td>
                          <Td fontSize="xs" color="text.secondary" maxW="250px">
                            {v.comment || "—"}
                          </Td>
                          <Td maxW="250px">
                            <Flex wrap="wrap" gap={1}>
                              {(v.validatedSkills || []).map((s, sIdx) => (
                                <SkillTag key={sIdx} skill={s} colorScheme="green" size="sm" />
                              ))}
                            </Flex>
                          </Td>
                          <Td fontSize="2xs" color="text.muted">
                            {v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-IN") : "Recent"}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <EmptyState
                  icon={CheckCircleIcon}
                  title="No validations submitted yet"
                  description="Choose a course from the Pending Review tab to submit your first industry validation."
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmitValidation}>
            <ModalHeader color="brand.500" fontWeight="700" borderBottomWidth="1px">
              Validate Course Curriculum
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={4}>
              {selectedCourse && (
                <VStack spacing={4} align="stretch">
                  <Box bg="#F8FAFC" p={3} borderRadius="md" borderWidth="1px" borderColor="#E2E8F0">
                    <Heading as="h4" size="xs" color="text.primary" mb={1}>
                      {selectedCourse.courseName || selectedCourse.name}
                    </Heading>
                    <Text fontSize="2xs" color="text.muted">
                      Sector: {selectedCourse.sector} | Provider: {selectedCourse.provider} | District: {selectedCourse.district}
                    </Text>
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                      Validation Assessment Status
                    </FormLabel>
                    <RadioGroup onChange={setStatus} value={status}>
                      <Stack direction="row" spacing={4}>
                        <Radio value="approved" colorScheme="green">
                          <Text fontSize="xs" fontWeight="600" color="green.700">
                            Approved (Industry Ready)
                          </Text>
                        </Radio>
                        <Radio value="needs_update" colorScheme="orange">
                          <Text fontSize="xs" fontWeight="600" color="orange.700">
                            Needs Update
                          </Text>
                        </Radio>
                        <Radio value="rejected" colorScheme="red">
                          <Text fontSize="xs" fontWeight="600" color="red.700">
                            Rejected
                          </Text>
                        </Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                      Which skills are relevant to modern industry needs?
                    </FormLabel>
                    <CheckboxGroup
                      value={validatedSkills}
                      onChange={(vals) => setValidatedSkills(vals)}
                    >
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} bg="#F8FAFC" p={3} borderRadius="md">
                        {(selectedCourse.skills || []).map((s, idx) => (
                          <Checkbox key={idx} value={s} colorScheme="brand" size="sm">
                            <Text fontSize="xs">{s}</Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                      Employer Review Comments / Recommendations
                    </FormLabel>
                    <Textarea
                      size="sm"
                      placeholder="Specify practical curriculum adjustments, missing tools, or industrial standards..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter borderTopWidth="1px">
              <Button variant="ghost" size="sm" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                size="sm"
                isLoading={validationMutation.isPending}
                loadingText="Submitting..."
              >
                Submit Validation
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageShell>
  );
};

export default ValidateCourses;
