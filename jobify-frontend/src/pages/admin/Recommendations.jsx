import React, { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  HStack,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { EditIcon, WarningIcon, CheckCircleIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/layout/PageShell";
import StatusBadge from "../../components/shared/StatusBadge";
import SkillTag from "../../components/shared/SkillTag";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/shared/EmptyState";
import api from "../../api/axios";

const Recommendations = () => {
  const [flagFilter, setFlagFilter] = useState("");

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["admin", "recommendations"],
    queryFn: async () => {
      const res = await api.get("/admin/recommendations");
      return res.data?.data || [];
    },
  });

  const filtered = recommendations.filter((rec) => {
    if (!flagFilter) return true;
    const flag = rec.flagType || rec.flag || rec.type || "";
    return flag.toLowerCase().includes(flagFilter.toLowerCase());
  });

  return (
    <PageShell
      role="admin"
      title="Curriculum Alignment Recommendations"
      subtitle="Automated curriculum modernization advisories based on real-time employer demand and skill vacancy gaps"
      breadcrumbItems={[{ label: "Curriculum Recommendations" }]}
    >
      {/* Top Filter Bar */}
      <Box
        bg="white"
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="sm"
        mb={6}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Box>
            <Text fontSize="xs" fontWeight="700" color="text.secondary">
              FILTER BY CURRICULUM URGENCY / STATUS
            </Text>
          </Box>
          <Box w={{ base: "full", sm: "220px" }}>
            <Select
              size="sm"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
            >
              <option value="">All Flags ({recommendations.length})</option>
              <option value="critical">Critical Only</option>
              <option value="needs_update">Needs Update</option>
            </Select>
          </Box>
        </Flex>
      </Box>

      {/* Recommendations Table */}
      <Box bg="white" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0" boxShadow="sm">
        <Box p={4} borderBottom="1px solid #E2E8F0">
          <Heading as="h4" size="xs" fontWeight="700" textTransform="uppercase" color="brand.500">
            Active Modernization Directives ({filtered.length})
          </Heading>
        </Box>

        {isLoading ? (
          <LoadingSpinner message="Evaluating curriculum gap scores and fetching directives..." />
        ) : filtered.length > 0 ? (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Course Name</Th>
                  <Th>District</Th>
                  <Th>Sector</Th>
                  <Th>Flag Type</Th>
                  <Th maxW="300px">Recommendation Directive</Th>
                  <Th>Suggested Skills to Add</Th>
                  <Th>Generated Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((item, idx) => {
                  const courseName =
                    item.course?.courseName || item.courseName || item.course || "Vocational Course";
                  const district = item.district || item.course?.district || "National";
                  const sector = item.sector || item.course?.sector || "Technical";
                  const flag = item.flagType || item.flag || "Needs Update";
                  const recText = item.recommendationText || item.recommendation || "Curriculum revision advised.";
                  const suggestedSkills = item.suggestedSkillsToAdd || item.suggestedSkills || [];

                  return (
                    <Tr key={item._id || item.id || idx} _hover={{ bg: "gray.50" }}>
                      <Td fontWeight="600" color="text.primary">
                        {courseName}
                      </Td>
                      <Td fontSize="xs">{district}</Td>
                      <Td fontSize="xs" color="text.secondary">
                        {sector}
                      </Td>
                      <Td>
                        <StatusBadge flag={flag} />
                      </Td>
                      <Td fontSize="xs" color="text.secondary" maxW="300px">
                        {recText}
                      </Td>
                      <Td maxW="240px">
                        <Flex wrap="wrap" gap={1}>
                          {suggestedSkills.map((s, sIdx) => (
                            <SkillTag key={sIdx} skill={s} colorScheme="orange" size="sm" />
                          ))}
                          {suggestedSkills.length === 0 && (
                            <Text fontSize="2xs" color="text.muted">
                              —
                            </Text>
                          )}
                        </Flex>
                      </Td>
                      <Td fontSize="2xs" color="text.muted">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "Recent"}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <EmptyState
            icon={CheckCircleIcon}
            title="No recommendations for this filter"
            description="All vocational course curricula in this category meet national alignment benchmarks."
          />
        )}
      </Box>
    </PageShell>
  );
};

export default Recommendations;
