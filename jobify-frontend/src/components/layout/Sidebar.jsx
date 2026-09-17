import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Flex,
  Divider,
} from "@chakra-ui/react";
import {
  SearchIcon,
  StarIcon,
  InfoOutlineIcon,
  EditIcon,
  CheckCircleIcon,
  RepeatIcon,
  SettingsIcon,
  ViewIcon,
  AddIcon,
  TimeIcon,
} from "@chakra-ui/icons";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ role = "trainee", onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const traineeLinks = [
    { name: "Overview Dashboard", path: "/trainee", icon: ViewIcon, exact: true },
    { name: "Pathway Finder", path: "/trainee/pathways", icon: SearchIcon },
    { name: "Skill Gap Analysis", path: "/trainee/skill-gap", icon: RepeatIcon, badge: "NEW" },
    { name: "Browse Courses", path: "/trainee/courses", icon: TimeIcon },
    { name: "Job Finder", path: "/trainee/jobs", icon: AddIcon, badge: "NEW" },
  ];

  const employerLinks = [
    { name: "Overview Dashboard", path: "/employer", icon: ViewIcon, exact: true },
    { name: "Post Jobs", path: "/employer/post-jobs", icon: AddIcon, badge: "NEW" },
    { name: "Validate Courses", path: "/employer/validate", icon: CheckCircleIcon },
    { name: "Demand Signals", path: "/employer/demand-signals", icon: AddIcon },
  ];

  const instituteLinks = [
    { name: "Overview", path: "/institute", icon: ViewIcon, exact: true },
    { name: "Institute Profile", path: "/institute?tab=profile", icon: SettingsIcon },
    { name: "Course Catalog", path: "/institute?tab=courses", icon: TimeIcon },
    { name: "Market Alignment", path: "/institute?tab=alignment", icon: CheckCircleIcon },
    { name: "Placement Outcomes", path: "/institute?tab=placements", icon: StarIcon },
    { name: "Notifications", path: "/institute?tab=notifications", icon: InfoOutlineIcon },
    { name: "Employer Feedback", path: "/institute?tab=employer-feedback", icon: EditIcon },
    { name: "Post a Job", path: "/institute?tab=post-job", icon: AddIcon },
  ];

  const adminLinks = [
    { name: "Executive Dashboard", path: "/admin", icon: ViewIcon, exact: true },
    { name: "Curriculum Recommendations", path: "/admin/recommendations", icon: EditIcon },
    { name: "Jobs Manager", path: "/admin/jobs", icon: SettingsIcon },
  ];

  let links = traineeLinks;
  let roleTitle = "Trainee Portal";
  if (role === "employer") {
    links = employerLinks;
    roleTitle = "Employer Portal";
  } else if (role === "institute") {
    links = instituteLinks;
    roleTitle = "Institute Portal";
  } else if (role === "admin") {
    links = adminLinks;
    roleTitle = "Admin Intelligence";
  }

  return (
    <Box
      w={{ base: "full", md: "240px" }}
      bg="white"
      borderRight="1px solid"
      borderColor="#E2E8F0"
      h="full"
      minH="calc(100vh - 67px)"
      py={4}
      px={3}
    >
      {/* Role Header Badge */}
      <Box px={3} py={2} mb={3} bg="#F8FAFC" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0">
        <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" color="brand.500" letterSpacing="wider">
          {roleTitle}
        </Text>
        <Text fontSize="xs" color="text.secondary" fontWeight="500" noOfLines={1} mt={0.5}>
          {user?.organization || user?.name || "Official Portal"}
        </Text>
      </Box>

      <Divider mb={3} borderColor="#E2E8F0" />

      {/* Navigation List */}
      <VStack spacing={1} align="stretch">
        {links.map((link) => {
          const [linkPath, linkQuery] = link.path.split("?");
          const isActive = linkQuery
            ? location.pathname === linkPath && location.search === `?${linkQuery}`
            : link.exact
            ? location.pathname === link.path
            : location.pathname.startsWith(link.path);

          return (
            <Box
              as={NavLink}
              to={link.path}
              key={link.path}
              onClick={onClose}
              px={3}
              py={2.5}
              borderRadius="md"
              bg={isActive ? "brand.50" : "transparent"}
              color={isActive ? "brand.500" : "text.secondary"}
              fontWeight={isActive ? "700" : "500"}
              borderLeft={isActive ? "3px solid #FF6B00" : "3px solid transparent"}
              _hover={{
                bg: isActive ? "brand.50" : "gray.50",
                color: isActive ? "brand.500" : "text.primary",
              }}
              transition="all 0.15s ease"
              display="block"
            >
              <Flex align="center" justify="space-between">
                <HStack spacing={3}>
                  <Icon
                    as={link.icon}
                    boxSize={4}
                    color={isActive ? "brand.500" : "gray.500"}
                  />
                  <Text fontSize="sm">{link.name}</Text>
                </HStack>
                {link.badge && (
                  <Badge
                    colorScheme="orange"
                    variant="solid"
                    fontSize="2xs"
                    px={1.5}
                    py={0.2}
                    borderRadius="full"
                  >
                    {link.badge}
                  </Badge>
                )}
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {/* National System Footer Info in Sidebar */}
      <Box mt={12} px={3} py={3} bg="#F4F6F9" borderRadius="md" border="1px dashed #CBD5E1">
        <Text fontSize="2xs" fontWeight="700" color="brand.500">
          SIH-134 ALIGNMENT
        </Text>
        <Text fontSize="2xs" color="text.muted" mt={1}>
          Curriculum & Labour Market Sync Engine Active.
        </Text>
      </Box>
    </Box>
  );
};

export default Sidebar;
