import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  VStack,
  Heading,
  Text,
  HStack,
  useToast,
  Link,
  Divider,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("trainee");
  const [organization, setOrganization] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long";
    }
    if (role === "employer" && !organization.trim()) {
      errs.organization = "Company / Enterprise name is required for employer accounts";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newUser = await register({
        name,
        email,
        password,
        role,
        organization: role === "employer" ? organization : "",
      });

      toast({
        title: "Account Created Successfully",
        description: `Welcome to Jobify, ${newUser.name}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });

      // Role-based destination
      const destination =
        newUser.role === "employer"
          ? "/employer"
          : newUser.role === "admin"
          ? "/admin"
          : "/trainee";

      navigate(destination, { replace: true });
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err.response?.data?.message || err.message || "Could not complete registration",
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

      <Container maxW="md" py={10} flex="1" display="flex" alignItems="center" justifyContent="center">
        <Box
          w="full"
          bg="white"
          p={{ base: 6, sm: 8 }}
          borderRadius="md"
          borderWidth="1px"
          borderColor="#E2E8F0"
          borderTop="4px solid #FF6B00"
          boxShadow="0 2px 4px rgba(0,0,0,0.06)"
        >
          {/* Header */}
          <VStack spacing={2} align="center" mb={6} textAlign="center">
            <HStack spacing={2}>
              <Box
                w="32px"
                h="32px"
                borderRadius="md"
                bg="#FF6B00"
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
              Create an Official Account
            </Heading>
            <Text fontSize="xs" color="text.muted">
              Select your role to access customized dashboards & intelligence tools
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel fontSize="xs" fontWeight="600" color="text.secondary">
                  Full Name
                </FormLabel>
                <Input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                />
                <FormErrorMessage fontSize="2xs">{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontSize="xs" fontWeight="600" color="text.secondary">
                  Official / Personal Email
                </FormLabel>
                <Input
                  type="email"
                  placeholder="name@domain.in"
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
                  Password (min. 6 characters)
                </FormLabel>
                <Input
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                />
                <FormErrorMessage fontSize="2xs">{errors.password}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="600" color="text.secondary">
                  Account Type / Role
                </FormLabel>
                <Select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (errors.organization) setErrors({ ...errors, organization: null });
                  }}
                >
                  <option value="trainee">Trainee / Jobseeker / Student</option>
                  <option value="employer">Employer / Industry Partner</option>
                </Select>
              </FormControl>

              {role === "employer" && (
                <FormControl isInvalid={!!errors.organization}>
                  <FormLabel fontSize="xs" fontWeight="600" color="text.secondary">
                    Company / Enterprise Name
                  </FormLabel>
                  <Input
                    type="text"
                    placeholder="e.g. Bharat Electronics Ltd."
                    value={organization}
                    onChange={(e) => {
                      setOrganization(e.target.value);
                      if (errors.organization) setErrors({ ...errors, organization: null });
                    }}
                  />
                  <FormErrorMessage fontSize="2xs">{errors.organization}</FormErrorMessage>
                </FormControl>
              )}

              <Button
                type="submit"
                bg="#FF6B00"
                color="white"
                _hover={{ bg: "#e66000" }}
                size="md"
                w="full"
                isLoading={isSubmitting}
                loadingText="Registering..."
                mt={2}
              >
                Register Account
              </Button>
            </VStack>
          </form>

          <Divider my={5} borderColor="#E2E8F0" />

          <Text fontSize="xs" textAlign="center" color="text.secondary">
            Already registered?{" "}
            <Link as={RouterLink} to="/login" color="brand.500" fontWeight="600">
              Sign In to your account
            </Link>
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
