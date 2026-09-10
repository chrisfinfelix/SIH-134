import React from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Progress,
  Flex,
} from "@chakra-ui/react";

const DistrictTable = ({ data = [], title = "District Employment & Training Balance" }) => {
  return (
    <Box
      bg="white"
      p={5}
      borderRadius="md"
      borderWidth="1px"
      borderColor="#E2E8F0"
      boxShadow="0 1px 3px rgba(0,0,0,0.05)"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Heading as="h3" size="sm" fontWeight="700" color="text.primary">
            {title}
          </Heading>
          <Text fontSize="xs" color="text.muted" mt={0.5}>
            Job demand vs training capacity by regional district
          </Text>
        </Box>
      </Flex>

      {data.length === 0 ? (
        <Flex h="200px" align="center" justify="center">
          <Text fontSize="sm" color="text.muted">
            No district data recorded.
          </Text>
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>District</Th>
                <Th isNumeric>Active Jobs</Th>
                <Th isNumeric>Courses Available</Th>
                <Th>Job / Course Balance</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item, index) => {
                const jobs = item.jobCount || item.jobs || 0;
                const courses = item.courseCount || item.courses || 0;
                const ratio = courses > 0 ? (jobs / courses).toFixed(1) : jobs > 0 ? "High" : "0";
                const isHighDemand = courses > 0 && jobs / courses > 3;
                const isUnderserved = courses === 0 && jobs > 0;
                const isBalanced = courses > 0 && jobs / courses <= 3 && jobs / courses >= 0.5;

                return (
                  <Tr key={item.district || index} _hover={{ bg: "gray.50" }}>
                    <Td fontWeight="600" color="text.primary">
                      {item.district}
                    </Td>
                    <Td isNumeric fontWeight="600" color="brand.500">
                      {jobs.toLocaleString("en-IN")}
                    </Td>
                    <Td isNumeric fontWeight="500">
                      {courses}
                    </Td>
                    <Td minW="140px">
                      <Flex align="center" gap={2}>
                        <Progress
                          value={Math.min(100, courses > 0 ? (jobs / (courses * 4)) * 100 : 90)}
                          size="xs"
                          colorScheme={isHighDemand || isUnderserved ? "orange" : "blue"}
                          borderRadius="full"
                          flex="1"
                        />
                        <Text fontSize="2xs" color="text.muted" w="32px">
                          {ratio}x
                        </Text>
                      </Flex>
                    </Td>
                    <Td>
                      {isUnderserved ? (
                        <Badge colorScheme="red" fontSize="2xs">
                          Skill Void
                        </Badge>
                      ) : isHighDemand ? (
                        <Badge colorScheme="orange" fontSize="2xs">
                          High Demand
                        </Badge>
                      ) : isBalanced ? (
                        <Badge colorScheme="green" fontSize="2xs">
                          Aligned
                        </Badge>
                      ) : (
                        <Badge colorScheme="gray" fontSize="2xs">
                          Moderate
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default DistrictTable;
