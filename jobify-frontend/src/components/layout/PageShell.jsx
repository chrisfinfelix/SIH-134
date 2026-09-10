import React from "react";
import {
  Box,
  Flex,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Container,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

const PageShell = ({
  role = "trainee",
  title,
  subtitle,
  breadcrumbItems = [],
  action,
  children,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const activeRole = role || user?.role || "trainee";

  return (
    <Box minH="100vh" bg="#F4F6F9">
      {/* Top Navbar with drawer trigger */}
      <Navbar onOpenSidebar={onOpen} isDashboard={true} />

      <Flex>
        {/* Desktop Left Sidebar */}
        <Box display={{ base: "none", md: "block" }}>
          <Sidebar role={activeRole} />
        </Box>

        {/* Mobile Drawer Sidebar */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent bg="white">
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" fontSize="md" color="brand.500" fontWeight="700">
              Jobify Portal
            </DrawerHeader>
            <DrawerBody p={0}>
              <Sidebar role={activeRole} onClose={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content Area */}
        <Box flex="1" minW="0" overflowX="hidden" pb={12}>
          {/* Top Breadcrumbs & Page Header Banner */}
          {(title || breadcrumbItems.length > 0) && (
            <Box bg="white" borderBottom="1px solid #E2E8F0" py={4} px={{ base: 4, md: 8 }}>
              {breadcrumbItems.length > 0 && (
                <Breadcrumb
                  spacing="8px"
                  separator={<ChevronRightIcon color="gray.500" boxSize={3} />}
                  fontSize="xs"
                  color="text.muted"
                  mb={2}
                >
                  <BreadcrumbItem>
                    <BreadcrumbLink as={RouterLink} to={`/${activeRole}`}>
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbItems.map((item, idx) => (
                    <BreadcrumbItem
                      key={idx}
                      isCurrentPage={idx === breadcrumbItems.length - 1}
                    >
                      {item.path ? (
                        <BreadcrumbLink as={RouterLink} to={item.path}>
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <Text color="brand.500" fontWeight="600">
                          {item.label}
                        </Text>
                      )}
                    </BreadcrumbItem>
                  ))}
                </Breadcrumb>
              )}

              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "flex-start", sm: "center" }}
                gap={3}
              >
                <Box>
                  {title && (
                    <Heading as="h1" size="md" fontWeight="700" color="text.primary">
                      {title}
                    </Heading>
                  )}
                  {subtitle && (
                    <Text fontSize="xs" color="text.secondary" mt={0.5}>
                      {subtitle}
                    </Text>
                  )}
                </Box>
                {action && <Box>{action}</Box>}
              </Flex>
            </Box>
          )}

          {/* Page Body Container */}
          <Container maxW="container.xl" py={6} px={{ base: 4, md: 8 }}>
            {children}
          </Container>
        </Box>
      </Flex>
    </Box>
  );
};

export default PageShell;
