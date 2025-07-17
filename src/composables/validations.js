import { useI18n } from 'vue-i18n'

function useValidation() {
  const { t } = useI18n()

  const requiredField = {
    required: true,
    message: t('REQUIRED_FIELD'),
    trigger: 'blur',
  }

  const phoneNumberField = {
    validator: (_rule, value) => {
      if (value.length < 17) {
        return Promise.reject(t('validations.invalid_phone_number'))
      }
      return Promise.resolve()
    },
    trigger: 'blur'
  }
  const emailField = {
    validator: (_rule, value) => {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (value && !emailPattern.test(value)) {
        return Promise.reject(t('validations.invalid_email'))
      }
      return Promise.resolve()
    },
    trigger: 'blur'
  }

  const validateLengthField = ({
    length,
    equal = false,
    formatting = false,
    max = false
  }) => ({
    validator: (_rule, value) => {
      if (!value) {
        return Promise.resolve()
      } else if (formatting && value.replace(/\s+/g, '').length !== length) {
        return Promise.reject(
          t('validations.required_length', { length: length })
        )
      } else if (max && value.length >= length) {
        return Promise.reject(
          t('validations.required_max_length', { length: length })
        )
      } else if (equal && value.length !== length) {
        return Promise.reject(
          t('validations.required_length', { length: length })
        )
      } else {
        return Promise.resolve()
      }
    },
    trigger: 'blur'
  })
  const percentField = {
    validator: (_rule, value) => {
      if (value > 100) {
        return Promise.reject(
          t('validations.percentage_should_not_be_greater_than')
        )
      }
      return Promise.resolve()
    }
  }
  return {
    requiredField,
    phoneNumberField,
    emailField,
    validateLengthField,
    percentField
  }
}

export default useValidation
