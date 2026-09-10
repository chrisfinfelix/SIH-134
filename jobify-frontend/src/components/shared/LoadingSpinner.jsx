import React from "react";
import { Center, Spinner, Text, VStack } from "@chakra-ui/react";

const LoadingSpinner = ({ message = "Loading data from National Portal..." }) => {
  return (
    <Center py={16} w="100%">
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
        <Text fontSize="sm" color="text.secondary" fontWeight="500">
          {message}
        </Text>
      </VStack>
    </Center>
  );
};

export default LoadingSpinner;
