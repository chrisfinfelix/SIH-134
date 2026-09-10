import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
  Button,
  SimpleGrid,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider,
} from "@chakra-ui/react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatusBadge from "../../components/shared/StatusBadge";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";

const CourseBrowser = () => {
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [skill, setSkill] = useState("");
  const [flag, setFlag] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedCourse, setSelectedCourse] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch courses with filters and pagination
  const { data: queryResult, isLoading, isFetching } = useQuery({
    queryKey: ["courses", { district, sector, skill, flag, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (district) params.append("district", district);
      if (sector) params.append("sector", sector);
      if (skill) params.append("skill", skill);
      if (flag) params.append("flag", flag);
      params.append("page", page);
      params.append("limit", limit);

      const res = await api.get(`/courses?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Extract list and pagination
  const courses = queryResult?.data || (Array.isArray(queryResult) ? queryResult : []);
  const pagination = queryResult?.pagination || {
    total: courses.length,
    page: page,
    totalPages: Math.ceil(courses.length / limit) || 1,
  };

  const handleRowClick = (course) => {
    setSelectedCourse(course);
    onOpen();
  };

  const handleResetFilters = () => {
    setDistrict("");
    setSector("");
    setSkill("");
    setFlag("");
    setPage(1);
  };

  return (
    <PageShell
      role="trainee"
      title="National Course Directory"
      subtitle="Browse and filter vocational courses by district, industry sector, curriculum flags, and skill sets"
      breadcrumbItems={[{ label: "Course Directory" }]}
    >
      {/* Filter Bar */}
      <Box
        bg="white"
        p={5}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3} mb={3}>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              SKILL KEYWORD
            </Text>
            <Input
              size="sm"
              placeholder="e.g. Python, CNC, Welding..."
              value={skill}
              onChange={(e) => {
                setSkill(e.target.value);
                setPage(1);
              }}
            />
          </Box>

          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              DISTRICT
            </Text>
            <Input
              size="sm"
              placeholder="Filter by district..."
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(1);
              }}
            />
          </Box>

          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              SECTOR
            </Text>
            <Select
              size="sm"
              value={sector}
              onChange={(e) => {
                setSector(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Sectors</option>
              <option value="IT-ITeS">IT & Software</option>
              <option value="Electronics">Electronics & Hardware</option>
              <option value="Automotive">Automotive & Manufacturing</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Renewable Energy">Renewable Energy</option>
              <option value="Construction">Construction</option>
            </Select>
          </Box>

          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              CURRICULUM STATUS / FLAG
            </Text>
            <Select
              size="sm"
              value={flag}
              onChange={(e) => {
                setFlag(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Good">Good (Aligned)</option>
              <option value="Needs Update">Needs Update</option>
              <option value="Critical">Critical Gap</option>
            </Select>
          </Box>
        </SimpleGrid>

        <Flex justify="flex-end" gap={2}>
          {(district || sector || skill || flag) && (
            <Button size="xs" variant="ghost" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          )}
        </Flex>
      </Box>

      {/* Course List Table */}
      {isLoading ? (
        <LoadingSpinner message="Fetching verified course registry..." />
      ) : courses.length > 0 ? (
        <Box
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          boxShadow="sm"
          overflowX="auto"
          mb={4}
        >
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Course Name</Th>
                <Th>Sector</Th>
                <Th>District</Th>
                <Th>NSQF</Th>
                <Th>Duration</Th>
                <Th>Gap Score</Th>
                <Th>Status</Th>
                <Th>Provider</Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => (
                <Tr
                  key={course._id || course.id}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => handleRowClick(course)}
                >
                  <Td fontWeight="600" color="brand.500">
                    {course.courseName || course.name}
                  </Td>
                  <Td fontSize="xs" color="text.secondary">
                    {course.sector || "Technical"}
                  </Td>
                  <Td fontSize="xs">{course.district || "Pan-India"}</Td>
                  <Td fontSize="xs">L{course.nsqfLevel || 4}</Td>
                  <Td fontSize="xs">
                    {course.durationWeeks ? `${course.durationWeeks} wks` : "8 wks"}
                  </Td>
                  <Td fontSize="xs" fontWeight="600">
                    {course.gapScore !== undefined ? course.gapScore : course.gap_score || "—"}
                  </Td>
                  <Td>
                    <StatusBadge flag={course.flag || course.status || "Good"} />
                  </Td>
                  <Td fontSize="xs" color="text.muted" maxW="150px" isTruncated>
                    {course.provider || "Government ITI"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* Pagination Controls */}
          <Flex
            justify="space-between"
            align="center"
            p={4}
            borderTop="1px solid #E2E8F0"
            fontSize="xs"
            color="text.secondary"
          >
            <Text>
              Page <strong>{page}</strong> of <strong>{pagination.totalPages || 1}</strong>
            </Text>
            <HStack spacing={2}>
              <Button
                size="xs"
                leftIcon={<ChevronLeftIcon />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                isDisabled={page <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                size="xs"
                rightIcon={<ChevronRightIcon />}
                onClick={() => setPage((p) => (pagination.totalPages ? Math.min(pagination.totalPages, p + 1) : p + 1))}
                isDisabled={pagination.totalPages ? page >= pagination.totalPages : false || isFetching}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="No courses found"
          description="Try adjusting your filter parameters to view other vocational training programs."
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      )}

      {/* Course Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="brand.500" fontWeight="700" borderBottomWidth="1px">
            Course Curriculum Specifications
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
                    Provider: {selectedCourse.provider || "National Vocational Institute"} | District: {selectedCourse.district || "National"}
                  </Text>
                </Box>

                <Divider borderColor="#E2E8F0" />

                <SimpleGrid columns={2} spacing={3} bg="#F8FAFC" p={3} borderRadius="md">
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      Sector
                    </Text>
                    <Text fontWeight="600">{selectedCourse.sector || "General"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      NSQF Level
                    </Text>
                    <Text fontWeight="600">Level {selectedCourse.nsqfLevel || 4}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      Duration
                    </Text>
                    <Text fontWeight="600">{selectedCourse.durationWeeks || 8} Weeks</Text>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" color="text.muted" textTransform="uppercase">
                      Curriculum Status
                    </Text>
                    <StatusBadge flag={selectedCourse.flag || "Good"} mt={0.5} />
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={1}>
                    Taught Skills:
                  </Text>
                  <Flex wrap="wrap" gap={1}>
                    {(selectedCourse.skills || []).map((s, idx) => (
                      <SkillTag key={idx} skill={s} colorScheme="blue" size="sm" />
                    ))}
                    {(!selectedCourse.skills || selectedCourse.skills.length === 0) && (
                      <Text fontSize="xs" color="text.muted">
                        No individual skill tags listed.
                      </Text>
                    )}
                  </Flex>
                </Box>

                {selectedCourse.recommendation && (
                  <Box p={3} bg="#fff0e5" borderRadius="md" borderLeft="3px solid #FF6B00">
                    <Text fontSize="2xs" fontWeight="700" color="#FF6B00" textTransform="uppercase">
                      AI Alignment Recommendation
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

export default CourseBrowser;
