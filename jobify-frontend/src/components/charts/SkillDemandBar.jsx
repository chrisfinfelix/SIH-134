import React from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        bg="white"
        p={3}
        borderRadius="md"
        borderWidth="1px"
        borderColor="#E2E8F0"
        boxShadow="md"
        fontSize="xs"
      >
        <Text fontWeight="700" color="brand.500">
          {data.skill || label}
        </Text>
        <Text color="text.secondary" mt={1}>
          Job Postings: <strong>{data.jobCount || data.count || 0}</strong>
        </Text>
        {data.percentage !== undefined && (
          <Text color="text.muted">
            Market Share: <strong>{data.percentage}%</strong>
          </Text>
        )}
      </Box>
    );
  }
  return null;
};

const SkillDemandBar = ({
  data = [],
  title,
  stateName = "All",
}) => {
  const displayTitle =
    title ||
    (stateName && stateName !== "All"
      ? `Top Demanded Skills in ${stateName}`
      : "Top Demanded Skills in National Job Market");

  // Format and take top 15-20 skills
  const chartData = (data || [])
    .slice(0, 15)
    .map((item) => ({
      skill: item.skill || item.name || item._id,
      jobCount: item.jobCount || item.count || 0,
      percentage: item.percentage !== undefined ? item.percentage : item.percentageOfJobs,
    }))
    .reverse(); // For horizontal layout so highest is at the top

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
            {displayTitle}
          </Heading>
          <Text fontSize="xs" color="text.muted" mt={0.5}>
            {stateName && stateName !== "All"
              ? `Aggregated across active job vacancies in ${stateName}`
              : "Aggregated across national active job vacancies"}
          </Text>
        </Box>
      </Flex>

      {chartData.length === 0 ? (
        <Flex h="320px" align="center" justify="center">
          <Text fontSize="sm" color="text.muted">
            No skill demand data available.
          </Text>
        </Flex>
      ) : (
        <Box h="420px" w="100%">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis
                type="number"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                tickFormatter={(val) => `${val}`}
              />
              <YAxis
                type="category"
                dataKey="skill"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="jobCount" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index >= chartData.length - 3 ? "#FF6B00" : "#003580"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default SkillDemandBar;
