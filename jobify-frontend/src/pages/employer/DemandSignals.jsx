import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
  Button,
  FormControl,
  FormLabel,
  SimpleGrid,
  Textarea,
  VStack,
  HStack,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { AddIcon, StarIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const DemandSignals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Form states
  const [company, setCompany] = useState(user?.organization || user?.name || "");
  const [sector, setSector] = useState("IT-ITeS");
  const [district, setDistrict] = useState("");
  const [hiringCount, setHiringCount] = useState("");
  const [notes, setNotes] = useState("");

  // Tag inputs for Skills and Target Roles
  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState([]);

  const [roleInput, setRoleInput] = useState("");
  const [rolesList, setRolesList] = useState([]);

  // Fetch past signals
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ["employer", "demand-signals"],
    queryFn: async () => {
      const res = await api.get("/employer/demand-signals");
      return res.data?.data || [];
    },
  });

  // Mutation to post signal
  const postSignalMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/employer/demand-signal", payload);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Demand Signal Published",
        description: "Hiring forecast registered in the National Labour Market database.",
        status: "success",
        duration: 3500,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["employer", "demand-signals"] });
      // Reset form
      setDistrict("");
      setHiringCount("");
      setNotes("");
      setSkillsList([]);
      setRolesList([]);
    },
    onError: (err) => {
      toast({
        title: "Failed to Post Signal",
        description: err.response?.data?.message || err.message || "An error occurred",
        status: "error",
        duration: 4000,
        isClosable: true,
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

  const handleAddRole = (e) => {
    if (e) e.preventDefault();
    if (roleInput.trim() && !rolesList.includes(roleInput.trim())) {
      setRolesList([...rolesList, roleInput.trim()]);
      setRoleInput("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!company.trim() || !district.trim() || !hiringCount) {
      toast({
        title: "Missing Required Fields",
        description: "Please specify company, district, and planned hires.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    postSignalMutation.mutate({
      company,
      sector,
      district,
      skills: skillsList,
      targetRoles: rolesList,
      hiringCount: Number(hiringCount),
      notes,
    });
  };

  return (
    <PageShell
      role="employer"
      title="Industry Demand Signals"
      subtitle="Broadcast forward-looking hiring counts and in-demand skills directly to regional vocational training centres"
      breadcrumbItems={[{ label: "Demand Signals" }]}
    >
      {/* Top Section: Form */}
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
              Post a New Industry Demand Signal
            </Heading>
            <Text fontSize="xs" color="text.muted">
              Submit projected job openings to influence curriculum planning in your district
            </Text>
          </Box>
          <Badge colorScheme="orange" fontSize="2xs" px={2} py={0.5} borderRadius="full">
            REAL-TIME DEMAND SYNC
          </Badge>
        </Flex>

        <form onSubmit={handleSubmit}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
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

            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Industry Sector
              </FormLabel>
              <Select size="sm" value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="IT-ITeS">IT-ITeS & Software</option>
                <option value="Electronics">Electronics & Hardware</option>
                <option value="Automotive">Automotive & Engineering</option>
                <option value="Healthcare">Healthcare & Life Sciences</option>
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="Logistics">Logistics & Supply Chain</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Target District
              </FormLabel>
              <Input
                size="sm"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Pune, Bengaluru, Jaipur"
              />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            {/* Required Skills Tag Input */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Required Technical / Vocational Skills
              </FormLabel>
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

            {/* Target Job Roles Tag Input */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Target Job Roles
              </FormLabel>
              <Flex gap={2} mb={2}>
                <Input
                  size="sm"
                  placeholder="e.g. Junior Developer, Line Operator"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRole();
                    }
                  }}
                />
                <Button size="sm" onClick={handleAddRole} colorScheme="brand" px={4}>
                  Add
                </Button>
              </Flex>
              <Box p={2} minH="40px" bg="gray.50" borderRadius="md" border="1px dashed #CBD5E1">
                <Flex wrap="wrap" gap={1}>
                  {rolesList.map((r, idx) => (
                    <SkillTag
                      key={idx}
                      skill={r}
                      colorScheme="orange"
                      removable
                      onRemove={(rk) => setRolesList(rolesList.filter((i) => i !== rk))}
                    />
                  ))}
                  {rolesList.length === 0 && (
                    <Text fontSize="2xs" color="text.muted">
                      No roles added yet
                    </Text>
                  )}
                </Flex>
              </Box>
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                Planned Hires (Number)
              </FormLabel>
              <Input
                type="number"
                size="sm"
                placeholder="e.g. 25"
                value={hiringCount}
                onChange={(e) => setHiringCount(e.target.value)}
                min="1"
              />
            </FormControl>

            <Box gridColumn={{ base: "span 1", md: "span 2" }}>
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="700" color="text.secondary">
                  Additional Notes / Industry Specifications
                </FormLabel>
                <Textarea
                  size="sm"
                  rows={2}
                  placeholder="Specific software versions, tooling, shift requirements, or eligibility notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </FormControl>
            </Box>
          </SimpleGrid>

          <Flex justify="flex-end">
            <Button
              type="submit"
              bg="#FF6B00"
              color="white"
              _hover={{ bg: "#e66000" }}
              size="sm"
              px={6}
              leftIcon={<AddIcon />}
              isLoading={postSignalMutation.isPending}
              loadingText="Publishing Signal..."
            >
              Broadcast Demand Signal
            </Button>
          </Flex>
        </form>
      </Box>

      {/* Bottom Section: Past Signals Table */}
      <Box bg="white" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0" boxShadow="sm">
        <Box p={4} borderBottom="1px solid #E2E8F0">
          <Heading as="h4" size="xs" fontWeight="700" textTransform="uppercase" color="brand.500">
            Past Demand Signals Broadcasted ({signals.length})
          </Heading>
        </Box>

        {isLoading ? (
          <LoadingSpinner message="Fetching recorded demand signals..." />
        ) : signals.length > 0 ? (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Sector</Th>
                  <Th>District</Th>
                  <Th>Required Skills</Th>
                  <Th>Target Roles</Th>
                  <Th isNumeric>Planned Hires</Th>
                </Tr>
              </Thead>
              <Tbody>
                {signals.map((sig, idx) => (
                  <Tr key={sig._id || idx} _hover={{ bg: "gray.50" }}>
                    <Td fontSize="2xs" color="text.muted">
                      {sig.createdAt ? new Date(sig.createdAt).toLocaleDateString("en-IN") : "Recent"}
                    </Td>
                    <Td fontSize="xs" fontWeight="600">
                      {sig.sector}
                    </Td>
                    <Td fontSize="xs">{sig.district}</Td>
                    <Td maxW="220px">
                      <Flex wrap="wrap" gap={1}>
                        {(sig.skills || []).map((s, i) => (
                          <SkillTag key={i} skill={s} colorScheme="blue" size="sm" />
                        ))}
                      </Flex>
                    </Td>
                    <Td maxW="220px">
                      <Flex wrap="wrap" gap={1}>
                        {(sig.targetRoles || []).map((r, i) => (
                          <SkillTag key={i} skill={r} colorScheme="orange" size="sm" />
                        ))}
                      </Flex>
                    </Td>
                    <Td isNumeric fontWeight="700" color="brand.500">
                      {sig.hiringCount}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <EmptyState
            icon={StarIcon}
            title="No demand signals posted yet"
            description="Use the form above to broadcast your organization's hiring demand."
          />
        )}
      </Box>
    </PageShell>
  );
};

export default DemandSignals;
