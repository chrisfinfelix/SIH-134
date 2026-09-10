import React from "react";
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Text,
  Badge,
  Avatar,
  Container,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, ChevronDownIcon, LockIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onOpenSidebar, isDashboard = false }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = (role) => {
    if (role === "employer") return "/employer";
    if (role === "institute") return "/institute";
    if (role === "admin") return "/admin";
    return "/trainee";
  };

  return (
    <Box position="sticky" top={0} zIndex={100} w="100%">
      {/* Top Tricolor Strip */}
      <Box h="3px" w="100%" bgGradient="linear(to-r, #FF6B00 33%, #FFFFFF 33%, #FFFFFF 66%, #1A7F4B 66%)" />

      {/* Main Government Navbar */}
      <Box bg="#003580" color="white" px={{ base: 4, md: 8 }} borderBottom="3px solid #FF6B00">
        <Flex h="64px" alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap={3}>
            {isDashboard && onOpenSidebar && (
              <IconButton
                display={{ base: "flex", md: "none" }}
                onClick={onOpenSidebar}
                icon={<HamburgerIcon />}
                variant="ghost"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                aria-label="Toggle Sidebar"
                size="md"
              />
            )}

            <RouterLink to="/">
              <HStack spacing={2} cursor="pointer">
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="md"
                  bg="white"
                  color="#003580"
                  align="center"
                  justify="center"
                  fontWeight="900"
                  fontSize="xl"
                  boxShadow="sm"
                >
                  J
                </Flex>
                <Box>
                  <HStack spacing={1}>
                    <Text fontSize="lg" fontWeight="800" letterSpacing="tight">
                      Jobify
                    </Text>
                    <Badge
                      fontSize="2xs"
                      colorScheme="orange"
                      variant="solid"
                      px={1.5}
                      py={0.2}
                      borderRadius="sm"
                    >
                      GOV.IN
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="gray.300" letterSpacing="wide" mt="-2px">
                    Labour Market Intelligence Platform
                  </Text>
                </Box>
              </HStack>
            </RouterLink>
          </Flex>

          {/* Nav Links */}
          <HStack spacing={4} alignItems="center">
            <HStack as="nav" spacing={4} display={{ base: "none", md: "flex" }}>
              <Button
                as={RouterLink}
                to="/"
                variant="ghost"
                color="white"
                size="sm"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
              >
                Home
              </Button>
              <Button
                as={RouterLink}
                to="/trainee/pathways"
                variant="ghost"
                color="white"
                size="sm"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
              >
                Career Pathways
              </Button>
              <Button
                as={RouterLink}
                to="/trainee/courses"
                variant="ghost"
                color="white"
                size="sm"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
              >
                Browse Courses
              </Button>
            </HStack>

            {/* Auth Actions */}
            {isAuthenticated && user ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  color="white"
                  rightIcon={<ChevronDownIcon />}
                  _hover={{ bg: "rgba(255,255,255,0.1)" }}
                  _active={{ bg: "rgba(255,255,255,0.2)" }}
                  size="sm"
                  px={2}
                >
                  <HStack spacing={2}>
                    <Avatar
                      size="xs"
                      name={user.name}
                      bg="#FF6B00"
                      color="white"
                      fontWeight="bold"
                    />
                    <Text display={{ base: "none", md: "inline" }} fontSize="sm" fontWeight="600">
                      {user.name}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList color="text.primary" fontSize="sm" shadow="lg" borderColor="#E2E8F0">
                  <Box px={3} py={2}>
                    <Text fontWeight="600" fontSize="sm">
                      {user.name}
                    </Text>
                    <Text fontSize="xs" color="text.muted">
                      {user.email}
                    </Text>
                    <Badge colorScheme="blue" fontSize="2xs" mt={1} textTransform="capitalize">
                      Role: {user.role}
                    </Badge>
                  </Box>
                  <MenuDivider />
                  <MenuItem
                    as={RouterLink}
                    to={getDashboardPath(user.role)}
                    fontWeight="500"
                  >
                    Go to Dashboard
                  </MenuItem>
                  {user.role === "trainee" && (
                    <MenuItem as={RouterLink} to="/trainee/skill-gap">
                      My Skill Gap Analysis
                    </MenuItem>
                  )}
                  <MenuDivider />
                  <MenuItem onClick={handleLogout} color="red.600">
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <HStack spacing={2}>
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="outline"
                  borderColor="white"
                  color="white"
                  size="sm"
                  _hover={{ bg: "rgba(255,255,255,0.15)" }}
                >
                  Sign In
                </Button>
                <Button
                  as={RouterLink}
                  to="/register"
                  bg="#FF6B00"
                  color="white"
                  size="sm"
                  _hover={{ bg: "#e66000" }}
                >
                  Register
                </Button>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};

export default Navbar;
