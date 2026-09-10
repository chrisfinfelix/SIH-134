import React from "react";
import { Tag, TagLabel, TagCloseButton } from "@chakra-ui/react";

const SkillTag = ({
  skill,
  removable = false,
  onRemove,
  colorScheme = "orange",
  size = "md",
  ...props
}) => {
  if (!skill) return null;

  return (
    <Tag
      size={size}
      borderRadius="full"
      variant="subtle"
      colorScheme={colorScheme}
      px={3}
      py={1}
      fontWeight="500"
      fontSize="xs"
      m={0.5}
      {...props}
    >
      <TagLabel>{skill}</TagLabel>
      {removable && onRemove && (
        <TagCloseButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove(skill);
          }}
        />
      )}
    </Tag>
  );
};

export default SkillTag;
