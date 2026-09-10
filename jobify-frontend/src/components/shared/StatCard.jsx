import React from "react";
import { Box, Flex, Stat, StatLabel, StatNumber, StatHelpText, Icon, Badge } from "@chakra-ui/react";

const StatCard = ({
  label,
  value,
  icon: IconComponent,
  color = "brand.500",
  helpText,
  badgeText,
  badgeColor = "red",
}) => {
  return (
    <Box
      bg="white"
      p={5}
      borderRadius="md"
      borderWidth="1px"
      borderColor="#E2E8F0"
      boxShadow="0 1px 3px rgba(0,0,0,0.05)"
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", transform: "translateY(-1px)" }}
    >
      <Flex justify="space-between" align="flex-start">
        <Stat>
          <StatLabel fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wider" color="text.secondary">
            {label}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="700" color="text.primary" mt={1}>
            {typeof value === "number" ? value.toLocaleString("en-IN") : value || "—"}
          </StatNumber>
          {helpText && (
            <StatHelpText mb={0} mt={1} fontSize="xs" color="text.muted">
              {helpText}
            </StatHelpText>
          )}
        </Stat>

        <Flex direction="column" align="flex-end" gap={2}>
          {IconComponent && (
            <Flex
              w={10}
              h={10}
              align="center"
              justify="center"
              borderRadius="md"
              bg="#e6eef8"
              color={color}
            >
              <Icon as={IconComponent} boxSize={5} />
            </Flex>
          )}
          {badgeText && (
            <Badge colorScheme={badgeColor} fontSize="2xs" px={2} py={0.5} borderRadius="full">
              {badgeText}
            </Badge>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default StatCard;
