import React from "react";
import { Box, Flex, Text, Icon, Badge } from "@chakra-ui/react";

// Label on top, value pinned to the bottom: cards in a row share a height, so
// values stay aligned even when some labels wrap onto two lines.
const StatCard = ({
  label,
  value,
  icon: IconComponent,
  color = "brand.500",
  helpText,
  badgeText,
  badgeColor = "red",
}) => {
  const display = typeof value === "number" ? value.toLocaleString("en-IN") : value ?? "—";

  return (
    <Box
      bg="white"
      p={5}
      h="full"
      borderRadius="md"
      borderWidth="1px"
      borderColor="#E2E8F0"
      boxShadow="0 1px 3px rgba(0,0,0,0.05)"
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", transform: "translateY(-1px)" }}
    >
      <Flex justify="space-between" align="stretch" h="full" gap={3}>
        <Flex direction="column" minW={0} flex="1">
          <Text fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wider" color="text.secondary">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="700" color="text.primary" mt="auto" pt={1} lineHeight="short">
            {display}
          </Text>
          {helpText && (
            <Text mt={1} fontSize="xs" color="text.muted">
              {helpText}
            </Text>
          )}
        </Flex>

        <Flex direction="column" align="flex-end" gap={2} flexShrink={0}>
          {IconComponent && (
            <Flex w={10} h={10} align="center" justify="center" borderRadius="md" bg="#e6eef8" color={color}>
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
