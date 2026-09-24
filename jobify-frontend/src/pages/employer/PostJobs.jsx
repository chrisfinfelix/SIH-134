import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  SimpleGrid,
  Textarea,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon, StarIcon, DeleteIcon } from "@chakra-ui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import AISkillDetectButton from "../../components/shared/AISkillDetectButton";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const PostJobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(user?.organization || user?.name || "");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [description, setDescription] = useState("");

  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState([]);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["employer", "jobs"],
    queryFn: async () => {
      const res = await api.get("/employer/jobs");
      return res.data?.data || [];
    },
  });

  const postJobMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/employer/jobs", payload);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Job Posted",
        description: "Your job posting is now live and visible to matching trainees in Job Finder.",
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["employer", "jobs"] });
      setTitle("");
      setDistrict("");
      setState("");
      setProficiencyLevel("");
      setSalaryRange("");
      setDescription("");
      setSkillsList([]);
    },
    onError: (err) => {
      toast({
        title: "Failed to Post Job",
        description: err.response?.data?.message || err.message || "An error occurred",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/employer/jobs/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Job posting removed", status: "info", duration: 2500 });
      queryClient.invalidateQueries({ queryKey: ["employer", "jobs"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to remove posting",
        description: err.response?.data?.message || err.message || "An error occurred",
        status: "error",
        duration: 4000,
      });
    },
  });

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    if (skillInput.trim() && !skillsList.includes(skillInput.trim())) {
      setSkillsList([...skillsList, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please specify a job title and company name.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    postJobMutation.mutate({
      title,
      company,
      district,
      state,
      skills: skillsList,
      proficiencyLevel,
      salaryRange,
      description,
    });
  };

  return (
    <PageShell
      role="employer"
      title="Post a Job"
      subtitle="Publish open roles directly to the Trainee Job Finder, matched automatically against trainee skill profiles"
      breadcrumbItems={[{ label: "Post Jobs" }]}
    >
      <Box
        bg="white"
        p={{ base: 5, md: 6 }}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        borderTop="4px solid #FF6B00"
        boxShadow="sm"
        mb={8}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Box>
            <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
              Post a New Job Opening
            </Heading>
            <Text fontSize="xs" color="text.muted">
              This job will immediately appear in the trainee Job Finder, ranked by skill match
            </Text>
          </Box>
          <Badge colorScheme="orange" fontSize="2xs" px={2} py={0.5} borderRadius="full">
            LIVE TO TRAINEES
          </Badge>
        </Flex>

        <form onSubmit={handleSubmit}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Job Title
              </FormLabel>
              <Input
                size="sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Junior Frontend Developer"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Company / Organization
              </FormLabel>
              <Input
                size="sm"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enterprise Name"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Required Proficiency Level
              </FormLabel>
              <Input
                size="sm"
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(e.target.value)}
                placeholder="e.g. Entry-level, Intermediate"
              />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                District
              </FormLabel>
              <Input
                size="sm"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Pune"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                State
              </FormLabel>
              <Input
                size="sm"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Salary Range
              </FormLabel>
              <Input
                size="sm"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. ₹15,000 - ₹22,000/month"
              />
            </FormControl>
          </SimpleGrid>

          <FormControl mb={4}>
            <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
              Job Description
            </FormLabel>
            <Textarea
              size="sm"
              rows={3}
              placeholder="Role responsibilities, tools used, eligibility, shift details — AI can pull skills from this"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormControl>

          <FormControl mb={4}>
            <Flex justify="space-between" align="center" mb={1} gap={2} wrap="wrap">
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary" mb={0}>
                Required Skills
              </FormLabel>
              <AISkillDetectButton
                text={description}
                existingSkills={skillsList}
                onDetected={(found) => setSkillsList((prev) => [...prev, ...found])}
              />
            </Flex>
            <Flex gap={2} mb={2}>
              <Input
                size="sm"
                placeholder="Type skill & press Enter or Add"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddSkill} colorScheme="brand" px={4}>
                Add
              </Button>
            </Flex>
            <Box p={2} minH="40px" bg="gray.50" borderRadius="md" border="1px dashed #CBD5E1">
              <Flex wrap="wrap" gap={1}>
                {skillsList.map((s, idx) => (
                  <SkillTag
                    key={idx}
                    skill={s}
                    colorScheme="blue"
                    removable
                    onRemove={(sk) => setSkillsList(skillsList.filter((i) => i !== sk))}
                  />
                ))}
                {skillsList.length === 0 && (
                  <Text fontSize="2xs" color="text.muted">
                    No skills added yet
                  </Text>
                )}
              </Flex>
            </Box>
          </FormControl>

          <Flex justify="flex-end">
            <Button
              type="submit"
              bg="#FF6B00"
              color="white"
              _hover={{ bg: "#e66000" }}
              size="sm"
              px={6}
              leftIcon={<AddIcon />}
              isLoading={postJobMutation.isPending}
              loadingText="Publishing Job..."
            >
              Publish Job Opening
            </Button>
          </Flex>
        </form>
      </Box>

      <Box bg="white" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0" boxShadow="sm">
        <Box p={4} borderBottom="1px solid #E2E8F0">
          <Heading as="h4" size="xs" fontWeight="700" textTransform="uppercase" color="brand.500">
            Your Job Postings ({jobs.length})
          </Heading>
        </Box>

        {isLoading ? (
          <LoadingSpinner message="Fetching your job postings..." />
        ) : jobs.length > 0 ? (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Posted</Th>
                  <Th>Title</Th>
                  <Th>Location</Th>
                  <Th>Skills</Th>
                  <Th>Salary</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {jobs.map((job) => (
                  <Tr key={job._id} _hover={{ bg: "gray.50" }}>
                    <Td fontSize="2xs" color="text.muted">
                      {job.postedDate ? new Date(job.postedDate).toLocaleDateString("en-IN") : "Recent"}
                    </Td>
                    <Td fontSize="xs" fontWeight="600">
                      {job.title}
                    </Td>
                    <Td fontSize="xs">
                      {job.district || "—"}{job.state ? `, ${job.state}` : ""}
                    </Td>
                    <Td maxW="220px">
                      <Flex wrap="wrap" gap={1}>
                        {(job.skills || []).map((s, i) => (
                          <SkillTag key={i} skill={s} colorScheme="blue" size="sm" />
                        ))}
                      </Flex>
                    </Td>
                    <Td fontSize="xs">{job.salaryRange || "—"}</Td>
                    <Td>
                      <IconButton
                        size="xs"
                        aria-label="Remove job posting"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        isLoading={deleteJobMutation.isPending && deleteJobMutation.variables === job._id}
                        onClick={() => deleteJobMutation.mutate(job._id)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <EmptyState
            icon={StarIcon}
            title="No jobs posted yet"
            description="Use the form above to publish your first job opening — it will instantly show up in trainees' Job Finder."
          />
        )}
      </Box>
    </PageShell>
  );
};

export default PostJobs;
