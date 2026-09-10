import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  Heading,
  Text,
  HStack,
  Badge,
  useToast,
  Link,
  InputGroup,
  InputRightElement,
  IconButton,
  Divider
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, LockIcon } from "@chakra-ui/icons";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!password) {
      errs.password = "Password is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      toast({
        title: "Signed In Successfully",
        description: `Welcome back, ${loggedInUser.name}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      // Role-based redirection
      const destination =
        location.state?.from?.pathname ||
        (loggedInUser.role === "employer"
          ? "/employer"
          : loggedInUser.role === "admin"
          ? "/admin"
          : "/trainee");

      navigate(destination, { replace: true });
    } catch (err) {
      toast({
        title: "Authentication Failed",
        description: err.response?.data?.message || err.message || "Invalid credentials",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bg="#F4F6F9" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="md" py={12} flex="1" display="flex" alignItems="center" justifyContent="center">
        <Box
          w="full"
          bg="white"
          p={{ base: 6, sm: 8 }}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          borderTop="4px solid #003580"
          boxShadow="0 2px 4px rgba(0,0,0,0.06)"
        >
          {/* Header */}
          <VStack spacing={2} align="center" mb={6} textAlign="center">
            <HStack spacing={2}>
              <Box
                w="32px"
                h="32px"
                borderRadius="md"
                bg="#003580"
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
              >
                J
              </Box>
              <Text fontSize="xl" fontWeight="800" color="brand.500">
                Jobify
              </Text>
            </HStack>
            <Heading as="h2" size="md" fontWeight="700" color="text.primary">
              Sign In to Your Account
            </Heading>
            <Text fontSize="xs" color="text.muted">
              National Labour Market Intelligence & Curriculum Alignment Platform
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontSize="xs" fontWeight="600" color="text.secondary">
                  Email Address
                </FormLabel>
                <Input
                  type="email"
                  size="md"
                  placeholder="name@organization.gov.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                />
                <FormErrorMessage fontSize="2xs">{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontSize="xs" fontWeight="600" color="text.secondary">
                  Password
                </FormLabel>
                <InputGroup size="md">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your secure password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage fontSize="2xs">{errors.password}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                size="md"
                w="full"
                isLoading={isSubmitting}
                loadingText="Verifying..."
                mt={2}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Box mt={6} p={3} bg="#F8FAFC" borderRadius="md" border="1px solid #E2E8F0" fontSize="2xs" color="text.muted">
            <Text fontWeight="700" color="brand.500" mb={1}>
              TEST ACCOUNTS (IF PRE-SEEDED):
            </Text>
            <Text>Admin: admin@jobify.gov.in (or register new)</Text>
            <Text>Employer: employer@techcorp.in</Text>
            <Text>Trainee: trainee@domain.in</Text>
          </Box>

          <Divider my={5} borderColor="#E2E8F0" />

          <Text fontSize="xs" textAlign="center" color="text.secondary">
            Don't have an official account?{" "}
            <Link as={RouterLink} to="/register" color="#FF6B00" fontWeight="600">
              Register here
            </Link>
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
