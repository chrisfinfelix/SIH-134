import React from "react";
import { Box, VStack, HStack, Text, Icon, Badge, Flex, Divider, Circle } from "@chakra-ui/react";
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
  SunIcon,
  AttachmentIcon,
} from "@chakra-ui/icons";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useAIStatus from "../../hooks/useAIStatus";

export const NAVBAR_HEIGHT = "70px";

const INSIGHTS_LINK = { name: "AI Market Intelligence", path: "/insights", icon: SunIcon, badge: "AI" };

const LINKS_BY_ROLE = {
  trainee: {
    title: "Trainee Portal",
    links: [
      { name: "Overview Dashboard", path: "/trainee", icon: ViewIcon, exact: true },
      { name: "Pathway Finder", path: "/trainee/pathways", icon: SearchIcon },
      { name: "Skill Gap Analysis", path: "/trainee/skill-gap", icon: RepeatIcon },
      { name: "Browse Courses", path: "/trainee/courses", icon: TimeIcon },
      { name: "Job Finder", path: "/trainee/jobs", icon: AttachmentIcon },
    ],
  },
  employer: {
    title: "Employer Portal",
    links: [
      { name: "Overview Dashboard", path: "/employer", icon: ViewIcon, exact: true },
      { name: "Validate Courses", path: "/employer/validate", icon: CheckCircleIcon },
      { name: "Demand Signals", path: "/employer/demand-signals", icon: AddIcon },
      { name: "Post Jobs", path: "/employer/post-jobs", icon: AttachmentIcon },
      INSIGHTS_LINK,
    ],
  },
  institute: {
    title: "Institute Portal",
    links: [
      { name: "Overview", path: "/institute", icon: ViewIcon, exact: true },
      { name: "Institute Profile", path: "/institute?tab=profile", icon: SettingsIcon },
      { name: "Course Catalog", path: "/institute?tab=courses", icon: TimeIcon },
      { name: "Market Alignment", path: "/institute?tab=alignment", icon: CheckCircleIcon },
      { name: "Placement Outcomes", path: "/institute?tab=placements", icon: StarIcon },
      { name: "Notifications", path: "/institute?tab=notifications", icon: InfoOutlineIcon },
      { name: "Employer Feedback", path: "/institute?tab=employer-feedback", icon: EditIcon },
      { name: "Post a Job", path: "/institute?tab=post-job", icon: AddIcon },
      INSIGHTS_LINK,
    ],
  },
  admin: {
    title: "Admin Intelligence",
    links: [
      { name: "Executive Dashboard", path: "/admin", icon: ViewIcon, exact: true },
      { name: "Curriculum Recommendations", path: "/admin/recommendations", icon: EditIcon },
      { name: "Jobs Manager", path: "/admin/jobs", icon: SettingsIcon },
      INSIGHTS_LINK,
    ],
  },
};

const isLinkActive = (link, location) => {
  const [linkPath, linkQuery] = link.path.split("?");
  if (linkQuery) {
    return location.pathname === linkPath && location.search === `?${linkQuery}`;
  }
  if (link.exact) {
    // An exact tab-host link (e.g. /institute) is only active when no tab is selected
    return location.pathname === link.path && !new URLSearchParams(location.search).get("tab");
  }
  return location.pathname.startsWith(link.path);
};

const AIStatusFooter = () => {
  const { data, isLoading } = useAIStatus();
  const online = data?.available;
  const color = isLoading ? "gray.400" : online ? "green.500" : "orange.400";

  return (
    <Box mt={8} px={3} py={3} bg="#F4F6F9" borderRadius="md" border="1px dashed #CBD5E1">
      <HStack spacing={2}>
        <Circle size="8px" bg={color} />
        <Text fontSize="2xs" fontWeight="700" color="brand.500" letterSpacing="wide">
          AI ENGINE {isLoading ? "CHECKING…" : online ? "ONLINE" : "OFFLINE"}
        </Text>
      </HStack>
      <Text fontSize="2xs" color="text.muted" mt={1}>
        {online
          ? "Forecasting, NER & skill-graph models ready."
          : isLoading
          ? "Connecting to the ML service…"
          : "Core portal works; AI features are paused."}
      </Text>
    </Box>
  );
};

const Sidebar = ({ role = "trainee", onClose, isDrawer = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { title, links } = LINKS_BY_ROLE[role] || LINKS_BY_ROLE.trainee;

  return (
    <Box
      w={{ base: "full", md: "248px" }}
      bg="white"
      position={isDrawer ? "static" : "sticky"}
      top={isDrawer ? undefined : NAVBAR_HEIGHT}
      h={isDrawer ? "full" : `calc(100vh - ${NAVBAR_HEIGHT})`}
      overflowY="auto"
      py={4}
      px={3}
    >
      <Box px={3} py={2} mb={3} bg="#F8FAFC" borderRadius="md" borderWidth="1px" borderColor="#E2E8F0">
        <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" color="brand.500" letterSpacing="wider">
          {title}
        </Text>
        <Text fontSize="xs" color="text.secondary" fontWeight="500" noOfLines={1} mt={0.5} title={user?.organization || user?.name}>
          {user?.organization || user?.name || "Official Portal"}
        </Text>
      </Box>

      <Divider mb={3} borderColor="#E2E8F0" />

      <VStack spacing={1} align="stretch" as="nav" aria-label={`${title} navigation`}>
        {links.map((link) => {
          const isActive = isLinkActive(link, location);
          return (
            <Box
              as={NavLink}
              to={link.path}
              key={link.path}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              px={3}
              py={2.5}
              borderRadius="md"
              bg={isActive ? "brand.50" : "transparent"}
              color={isActive ? "brand.500" : "text.secondary"}
              fontWeight={isActive ? "700" : "500"}
              borderLeft={isActive ? "3px solid #FF6B00" : "3px solid transparent"}
              _hover={{ bg: isActive ? "brand.50" : "gray.50", color: isActive ? "brand.500" : "text.primary" }}
              transition="all 0.15s ease"
              display="block"
            >
              <Flex align="center" justify="space-between" gap={2}>
                <HStack spacing={3} minW={0}>
                  <Icon as={link.icon} boxSize={4} flexShrink={0} color={isActive ? "brand.500" : "gray.500"} />
                  <Text fontSize="sm" lineHeight="short">
                    {link.name}
                  </Text>
                </HStack>
                {link.badge && (
                  <Badge
                    colorScheme={link.badge === "AI" ? "purple" : "orange"}
                    variant="solid"
                    fontSize="2xs"
                    px={1.5}
                    borderRadius="full"
                    flexShrink={0}
                  >
                    {link.badge}
                  </Badge>
                )}
              </Flex>
            </Box>
          );
        })}
      </VStack>

      <AIStatusFooter />
    </Box>
  );
};

export default Sidebar;
