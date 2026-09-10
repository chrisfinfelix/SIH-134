import { extendTheme } from "@chakra-ui/react";

const colors = {
  brand: {
    50: "#e6eef8",
    100: "#c0d4ed",
    200: "#96b8e1",
    300: "#6b9cd6",
    400: "#4885cc",
    500: "#003580", // Primary deep government navy
    600: "#002e70",
    700: "#00255b",
    800: "#001b44",
    900: "#00102b",
  },
  accent: {
    50: "#fff0e5",
    100: "#ffd9be",
    200: "#ffbf92",
    300: "#ffa466",
    400: "#ff8b40",
    500: "#FF6B00", // Indian saffron accent
    600: "#e66000",
    700: "#c75300",
    800: "#a84600",
    900: "#8a3900",
  },
  govSuccess: {
    500: "#1A7F4B",
    bg: "#eaf6ef",
    border: "#b2e0c6",
  },
  govWarning: {
    500: "#B45309",
    bg: "#fef3c7",
    border: "#fde68a",
  },
  govDanger: {
    500: "#C0392B",
    bg: "#fde8e8",
    border: "#fca5a5",
  },
  surface: {
    light: "#F4F6F9",
    card: "#FFFFFF",
    border: "#E2E8F0",
    borderDark: "#CBD5E1",
  },
  text: {
    primary: "#1A202C",
    secondary: "#4A5568",
    muted: "#718096",
  },
};

const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 600,
      borderRadius: "md",
    },
    variants: {
      solid: (props) => {
        if (props.colorScheme === "brand" || !props.colorScheme) {
          return {
            bg: "#003580",
            color: "white",
            _hover: {
              bg: "#002863",
              _disabled: {
                bg: "#003580",
              },
            },
          };
        }
        if (props.colorScheme === "accent" || props.colorScheme === "orange") {
          return {
            bg: "#FF6B00",
            color: "white",
            _hover: {
              bg: "#e66000",
            },
          };
        }
        return {};
      },
      outline: (props) => {
        if (props.colorScheme === "brand") {
          return {
            borderColor: "#003580",
            color: "#003580",
            _hover: {
              bg: "brand.50",
            },
          };
        }
        return {};
      },
    },
  },
  Table: {
    variants: {
      simple: {
        th: {
          borderColor: "#E2E8F0",
          color: "#4A5568",
          fontWeight: 600,
          textTransform: "none",
          fontSize: "xs",
          letterSpacing: "wider",
          bg: "#F8FAFC",
          py: 3,
        },
        td: {
          borderColor: "#E2E8F0",
          color: "#1A202C",
          fontSize: "sm",
          py: 3,
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: "white",
        borderRadius: "md",
        borderWidth: "1px",
        borderColor: "#E2E8F0",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      },
    },
  },
};

const theme = extendTheme({
  colors,
  fonts,
  components,
  styles: {
    global: {
      "html, body": {
        bg: "#F4F6F9",
        color: "#1A202C",
        fontFamily: `'Inter', sans-serif`,
        lineHeight: "base",
      },
    },
  },
});

export default theme;
