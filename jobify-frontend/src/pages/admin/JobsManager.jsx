import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  useDisclosure,
  useToast,
  Badge,
} from "@chakra-ui/react";
import {
  AddIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AttachmentIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";

const JobsManager = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Filters and pagination
  const [district, setDistrict] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const singleModal = useDisclosure();
  const bulkModal = useDisclosure();

  // Single Job Form State
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDistrict, setJobDistrict] = useState("");
  const [jobState, setJobState] = useState("");
  const [sector, setSector] = useState("IT-ITeS");
  const [experience, setExperience] = useState("0-2 Years");
  const [jobSkillInput, setJobSkillInput] = useState("");
  const [jobSkills, setJobSkills] = useState([]);

  // Bulk Import State
  const [jsonInput, setJsonInput] = useState("");

  // Fetch Jobs
  const { data: jobsResult, isLoading, isFetching } = useQuery({
    queryKey: ["jobs", { district, state: stateFilter, skill, role, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (district) params.append("district", district);
      if (stateFilter) params.append("state", stateFilter);
      if (skill) params.append("skill", skill);
      if (role) params.append("role", role);
      params.append("page", page);
      params.append("limit", limit);

      const res = await api.get(`/jobs?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Single Job Mutation
  const createJobMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/jobs", payload);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Job Created",
        description: "New job vacancy indexed successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      singleModal.onClose();
      // Reset
      setTitle("");
      setCompany("");
      setJobDistrict("");
      setJobState("");
      setJobSkills([]);
    },
    onError: (err) => {
      toast({
        title: "Creation Failed",
        description: err.response?.data?.message || err.message || "Could not create job",
        status: "error",
        duration: 4000,
      });
    },
  });

  // Bulk Import Mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (jobsArray) => {
      const res = await api.post("/jobs/bulk", jobsArray);
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Import Completed",
        description: `Successfully indexed ${data.count || "jobs"} vacancies.`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      bulkModal.onClose();
      setJsonInput("");
    },
    onError: (err) => {
      toast({
        title: "Bulk Import Failed",
        description: err.response?.data?.message || err.message || "Invalid JSON or server error",
        status: "error",
        duration: 4500,
      });
    },
  });

  const handleAddJobSkill = (e) => {
    if (e) e.preventDefault();
    if (jobSkillInput.trim() && !jobSkills.includes(jobSkillInput.trim())) {
      setJobSkills([...jobSkills, jobSkillInput.trim()]);
      setJobSkillInput("");
    }
  };

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !jobDistrict.trim()) {
      toast({
        title: "Missing Fields",
        description: "Title, Company, and District are required.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    createJobMutation.mutate({
      title,
      company,
      district: jobDistrict,
      state: jobState || "Maharashtra",
      sector,
      experienceLevel: experience,
      skills: jobSkills,
    });
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be a JSON array of job objects.");
      }
      bulkImportMutation.mutate(parsed);
    } catch (err) {
      toast({
        title: "Invalid JSON Format",
        description: err.message || "Please check your JSON array syntax.",
        status: "error",
        duration: 4000,
      });
    }
  };

  const jobs = jobsResult?.data || (Array.isArray(jobsResult) ? jobsResult : []);
  const pagination = jobsResult?.pagination || {
    total: jobs.length,
    page: page,
    totalPages: Math.ceil(jobs.length / limit) || 1,
  };

  return (
    <PageShell
      role="admin"
      title="National Jobs & Vacancy Manager"
      subtitle="Manage real-time job listings, bulk import corporate datasets, and index required skill profiles"
      breadcrumbItems={[{ label: "Jobs Manager" }]}
      action={
        <HStack spacing={2}>
          <Button
            size="sm"
            variant="outline"
            borderColor="#003580"
            color="#003580"
            leftIcon={<AttachmentIcon />}
            onClick={bulkModal.onOpen}
          >
            Bulk Import (JSON)
          </Button>
          <Button
            size="sm"
            bg="#FF6B00"
            color="white"
            _hover={{ bg: "#e66000" }}
            leftIcon={<AddIcon />}
            onClick={singleModal.onOpen}
          >
            Add Single Job
          </Button>
        </HStack>
      }
    >
      {/* Filter Toolbar */}
      <Box
        bg="white"
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              ROLE / TITLE KEYWORD
            </Text>
            <Input
              size="sm"
              placeholder="e.g. Developer, Technician..."
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            />
          </Box>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              REQUIRED SKILL
            </Text>
            <Input
              size="sm"
              placeholder="e.g. React, CAD, Python..."
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
              placeholder="e.g. Pune, Bangalore..."
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(1);
              }}
            />
          </Box>
          <Box>
            <Text fontSize="2xs" fontWeight="700" color="text.secondary" mb={1}>
              STATE
            </Text>
            <Input
              size="sm"
              placeholder="e.g. Maharashtra, Karnataka..."
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
            />
          </Box>
        </SimpleGrid>
      </Box>

      {/* Jobs Table */}
      {isLoading ? (
        <LoadingSpinner message="Querying national job listings..." />
      ) : jobs.length > 0 ? (
        <Box bg="white" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0" boxShadow="sm" overflowX="auto" mb={4}>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Job Title</Th>
                <Th>Company</Th>
                <Th>District / State</Th>
                <Th>Sector</Th>
                <Th>Skills Required</Th>
                <Th>Experience</Th>
              </Tr>
            </Thead>
            <Tbody>
              {jobs.map((job) => (
                <Tr key={job._id || job.id} _hover={{ bg: "gray.50" }}>
                  <Td fontWeight="600" color="brand.500">
                    {job.title}
                  </Td>
                  <Td fontWeight="500">{job.company}</Td>
                  <Td fontSize="xs">
                    {job.district}{job.state ? `, ${job.state}` : ""}
                  </Td>
                  <Td fontSize="xs" color="text.secondary">
                    {job.sector || "General"}
                  </Td>
                  <Td maxW="280px">
                    <Flex wrap="wrap" gap={1}>
                      {(job.skills || []).map((s, idx) => (
                        <SkillTag key={idx} skill={s} colorScheme="blue" size="sm" />
                      ))}
                    </Flex>
                  </Td>
                  <Td fontSize="xs" color="text.muted">
                    {job.experienceLevel || "Entry"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* Pagination */}
          <Flex justify="space-between" align="center" p={4} borderTop="1px solid #E2E8F0" fontSize="xs" color="text.secondary">
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
          title="No jobs found"
          description="Adjust your search filters or click 'Add Single Job' to post one."
        />
      )}

      {/* Single Job Creation Modal */}
      <Modal isOpen={singleModal.isOpen} onClose={singleModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleCreateJob}>
            <ModalHeader color="brand.500" fontWeight="700" borderBottomWidth="1px">
              Index New Job Vacancy
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={4}>
              <VStack spacing={3} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="700">Job Title</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Full Stack Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="700">Company / Enterprise</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Tata Consultancy Services"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" fontWeight="700">District</FormLabel>
                    <Input
                      size="sm"
                      placeholder="e.g. Pune"
                      value={jobDistrict}
                      onChange={(e) => setJobDistrict(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700">State</FormLabel>
                    <Input
                      size="sm"
                      placeholder="e.g. Maharashtra"
                      value={jobState}
                      onChange={(e) => setJobState(e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700">Industry Sector</FormLabel>
                    <Select size="sm" value={sector} onChange={(e) => setSector(e.target.value)}>
                      <option value="IT-ITeS">IT-ITeS</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Construction">Construction</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="700">Experience</FormLabel>
                    <Select size="sm" value={experience} onChange={(e) => setExperience(e.target.value)}>
                      <option value="Entry Level (0-1 yrs)">Entry Level (0-1 yrs)</option>
                      <option value="Mid Level (2-4 yrs)">Mid Level (2-4 yrs)</option>
                      <option value="Senior Level (5+ yrs)">Senior Level (5+ yrs)</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="700">Skills Required (Pill Tags)</FormLabel>
                  <Flex gap={2} mb={2}>
                    <Input
                      size="sm"
                      placeholder="Type skill & press Enter"
                      value={jobSkillInput}
                      onChange={(e) => setJobSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddJobSkill();
                        }
                      }}
                    />
                    <Button size="sm" onClick={handleAddJobSkill} colorScheme="brand">
                      Add
                    </Button>
                  </Flex>
                  <Box p={2} minH="40px" bg="gray.50" borderRadius="md" border="1px dashed #CBD5E1">
                    <Flex wrap="wrap" gap={1}>
                      {jobSkills.map((s, i) => (
                        <SkillTag
                          key={i}
                          skill={s}
                          colorScheme="blue"
                          removable
                          onRemove={(sk) => setJobSkills(jobSkills.filter((item) => item !== sk))}
                        />
                      ))}
                    </Flex>
                  </Box>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter borderTopWidth="1px">
              <Button variant="ghost" size="sm" mr={3} onClick={singleModal.onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                size="sm"
                isLoading={createJobMutation.isPending}
              >
                Save Job Vacancy
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Bulk Import JSON Modal */}
      <Modal isOpen={bulkModal.isOpen} onClose={bulkModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleBulkSubmit}>
            <ModalHeader color="brand.500" fontWeight="700" borderBottomWidth="1px">
              Bulk Import Jobs (JSON Array)
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={4}>
              <Text fontSize="xs" color="text.muted" mb={3}>
                Paste a valid JSON array of job objects. Each item must contain <code>title</code>, <code>company</code>, <code>district</code>, and <code>skills</code>.
              </Text>
              <Textarea
                rows={10}
                fontFamily="monospace"
                fontSize="xs"
                placeholder={`[
  {
    "title": "Solar Installation Technician",
    "company": "Tata Power Solar",
    "district": "Pune",
    "state": "Maharashtra",
    "sector": "Renewable Energy",
    "skills": ["Solar Inverters", "Electrical Wiring", "Photovoltaic Systems"]
  }
]`}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
            </ModalBody>
            <ModalFooter borderTopWidth="1px">
              <Button variant="ghost" size="sm" mr={3} onClick={bulkModal.onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                bg="#FF6B00"
                color="white"
                _hover={{ bg: "#e66000" }}
                size="sm"
                isLoading={bulkImportMutation.isPending}
                loadingText="Importing..."
              >
                Import Jobs Array
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </PageShell>
  );
};

export default JobsManager;
