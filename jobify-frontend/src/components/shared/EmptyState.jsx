import React from "react";
import { Box, Button, Center, Heading, Icon, Text, VStack } from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";

const EmptyState = ({
  icon = InfoOutlineIcon,
  title = "No records found",
  description = "There are no matching items for the selected criteria or filters.",
  actionLabel,
  onAction,
}) => {
  return (
    <Center
      py={14}
      px={6}
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      borderColor="#E2E8F0"
      w="100%"
    >
      <VStack spacing={3} maxW="md" textAlign="center">
        <Box
          p={3}
          borderRadius="full"
          bg="gray.50"
          color="gray.400"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Icon as={icon} boxSize={8} />
        </Box>
        <Heading as="h4" size="md" fontWeight="600" color="text.primary">
          {title}
        </Heading>
        <Text fontSize="sm" color="text.secondary">
          {description}
        </Text>
        {actionLabel && onAction && (
          <Button
            size="sm"
            colorScheme="brand"
            mt={2}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Center>
  );
};

export default EmptyState;
