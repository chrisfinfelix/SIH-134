import React, { useState } from "react";
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
} from "@chakra-ui/react";
import { SearchIcon, ChevronDownIcon, ChevronUpIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";

const CourseRow = ({ course }) => {
  const { isOpen, onToggle } = useDisclosure();
  const match = course.matchPercentage || 0;
  const matchColor = match >= 70 ? "green" : match >= 40 ? "orange" : "red";

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
            <Text>{course.courseName}</Text>
          </Flex>
        </Td>
        <Td color="text.secondary">{course.provider || "National Skill Center"}</Td>
        <Td>{course.district || "Pan-India"}</Td>
        <Td>{course.durationWeeks ? `${course.durationWeeks} wks` : "8 wks"}</Td>
        <Td minW="150px">
          <Flex align="center" gap={2}>
            <Progress
              value={match}
              size="xs"
              colorScheme={matchColor}
              borderRadius="full"
              flex="1"
            />
            <Text fontSize="xs" fontWeight="700" color={`${matchColor}.600`} w="40px">
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
              <Badge fontSize="2xs">+{course.matchedSkills.length - 3}</Badge>
            )}
          </HStack>
        </Td>
      </Tr>

      {/* Expandable Details */}
      <Tr>
        <Td colSpan={6} p={0} borderBottom={isOpen ? "1px solid #E2E8F0" : "none"}>
          <Collapse in={isOpen} animateOpacity>
            <Box p={4} bg="#F8FAFC" borderLeft="4px solid #003580">
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="green.700" textTransform="uppercase" mb={1}>
                    Matched Skills Covered ({course.matchedSkills?.length || 0}):
                  </Text>
                  <Flex wrap="wrap" gap={1}>
                    {(course.matchedSkills || []).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="green" size="sm" />
                    ))}
                    {(course.matchedSkills || []).length === 0 && (
                      <Text fontSize="xs" color="text.muted">
                        None
                      </Text>
                    )}
                  </Flex>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="700" color="red.600" textTransform="uppercase" mb={1}>
                    Missing Skills Not Covered in this Course ({course.missingSkills?.length || 0}):
                  </Text>
                  <Flex wrap="wrap" gap={1}>
                    {(course.missingSkills || []).map((s, i) => (
                      <SkillTag key={i} skill={s} colorScheme="red" size="sm" />
                    ))}
                    {(course.missingSkills || []).length === 0 && (
                      <Text fontSize="xs" color="green.600" fontWeight="600">
                        Complete curriculum match! No missing skills.
                      </Text>
                    )}
                  </Flex>
                </Box>
              </VStack>
            </Box>
          </Collapse>
        </Td>
      </Tr>
    </>
  );
};

const PathwayFinder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("targetRole") || "Full Stack Developer";
  const [targetRole, setTargetRole] = useState(initialRole);
  const [searchQuery, setSearchQuery] = useState(initialRole);
  const toast = useToast();

  const {
    data: pathwayData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["trainee", "pathways", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      const res = await api.get(`/trainee/pathways?targetRole=${encodeURIComponent(searchQuery)}`);
      return res.data?.data;
    },
    enabled: !!searchQuery,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!targetRole.trim()) {
      toast({
        title: "Role Required",
        description: "Please enter a target job role to search for pathways.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setSearchQuery(targetRole.trim());
    setSearchParams({ targetRole: targetRole.trim() });
  };

  const courses = pathwayData?.courses || [];
  const requiredSkills = pathwayData?.requiredSkills || [];
  const totalJobsFound = pathwayData?.totalJobsFound || 0;

  return (
    <PageShell
      role="trainee"
      title="Career Pathway Finder"
      subtitle="Search by targeted job role to discover market-demanded competencies and ranked curriculum courses"
      breadcrumbItems={[{ label: "Career Pathways" }]}
    >
      {/* Search Bar Container */}
      <Box
        bg="white"
        p={5}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <form onSubmit={handleSearch}>
          <Flex direction={{ base: "column", sm: "row" }} gap={3}>
            <Input
              size="lg"
              placeholder="e.g. Full Stack Developer, Data Analyst, Electrician, CNC Operator"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              bg="gray.50"
            />
            <Button
              type="submit"
              size="lg"
              colorScheme="brand"
              px={8}
              leftIcon={<SearchIcon />}
              isLoading={isLoading || isFetching}
            >
              Search Pathways
            </Button>
          </Flex>
        </form>

        {/* Quick Suggestions */}
        <HStack spacing={2} mt={3} wrap="wrap" fontSize="xs" color="text.muted">
          <Text fontWeight="600">Quick Searches:</Text>
          {["Full Stack Developer", "Data Analyst", "Electrician", "Solar Technician"].map((role) => (
            <Button
              key={role}
              size="xs"
              variant="outline"
              borderColor="#E2E8F0"
              onClick={() => {
                setTargetRole(role);
                setSearchQuery(role);
                setSearchParams({ targetRole: role });
              }}
            >
              {role}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Search Results Summary Header */}
      {searchQuery && pathwayData && (
        <Box
          bg="white"
          p={5}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          borderLeft="4px solid #FF6B00"
          mb={6}
        >
          <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={3}>
            <Box>
              <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
                Role Analysis: {pathwayData.targetRole}
              </Heading>
              <Text fontSize="xs" color="text.secondary" mt={0.5}>
                Required skills extracted from active national employment postings
              </Text>
            </Box>
            <Badge colorScheme="blue" fontSize="xs" px={3} py={1} borderRadius="full">
              {totalJobsFound} Active Jobs Found
            </Badge>
          </Flex>

          <Divider my={3} borderColor="#E2E8F0" />

          <Box>
            <Text fontSize="xs" fontWeight="700" color="text.secondary" mb={2}>
              Key Required Competencies for this Role:
            </Text>
            <Flex wrap="wrap" gap={1.5}>
              {requiredSkills.map((skill, idx) => (
                <SkillTag key={idx} skill={skill} colorScheme="orange" size="md" />
              ))}
              {requiredSkills.length === 0 && (
                <Text fontSize="xs" color="text.muted">
                  No explicit skill tags indexed for this role keyword yet.
                </Text>
              )}
            </Flex>
          </Box>
        </Box>
      )}

      {/* Courses Results Table */}
      {isLoading ? (
        <LoadingSpinner message="Querying national course registry and computing skill alignment..." />
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
            <Heading as="h4" size="xs" fontWeight="700" textTransform="uppercase" color="brand.500">
              Ranked Curriculum Courses by Match Percentage ({courses.length} Available)
            </Heading>
            <Text fontSize="xs" color="text.muted">
              Click any row to expand matched vs missing skill details
            </Text>
          </Box>

          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Course Name</Th>
                <Th>Training Provider</Th>
                <Th>District</Th>
                <Th>Duration</Th>
                <Th>Skill Match %</Th>
                <Th>Matched Skills</Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => (
                <CourseRow key={course.courseId} course={course} />
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : searchQuery ? (
        <EmptyState
          icon={SearchIcon}
          title={`No matching courses found for "${searchQuery}"`}
          description="Try searching for another role or explore our full vocational course directory."
          actionLabel="Browse All Courses"
          onAction={() => window.location.assign("/trainee/courses")}
        />
      ) : null}
    </PageShell>
  );
};

export default PathwayFinder;
