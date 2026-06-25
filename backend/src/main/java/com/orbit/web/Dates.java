package com.orbit.web;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

final class Dates {

    private Dates() {
    }

    static LocalDate parse(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date '" + value + "', expected YYYY-MM-DD");
        }
    }
}
