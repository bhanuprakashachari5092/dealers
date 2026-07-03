import React, { memo } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

// Using memo to prevent unnecessary re-renders that cause focus loss
export const InputField = memo(({ label, error, isPassword, style, value, onChangeText, placeholder, ...props }: InputFieldProps) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null,
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          value={value}
          onChangeText={onChangeText}
          underlineColorAndroid="transparent"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.textSecondary} />
            ) : (
              <Eye size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 28, 36, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    height: '100%',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
