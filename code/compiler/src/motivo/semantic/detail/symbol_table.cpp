#include "motivo/semantic/detail/symbol_table.hpp"

#include <cassert>
#include <ranges>
#include <utility>

#include "motivo/common/ast/definitions.hpp"
#include "motivo/common/types/type_rules.hpp"

namespace motivo::semantic::detail {

ScopeId SymbolTable::add_scope(const std::optional<ScopeId> parent) {
    if (parent) {
        assert(*parent < scopes_.size());
    }

    const ScopeId id = scopes_.size();
    scopes_.emplace_back(id, parent);

    return id;
}

const Scope* SymbolTable::get_scope(const ScopeId id) const { return id < scopes_.size() ? &scopes_[id] : nullptr; }

SymbolId SymbolTable::add_symbol(const ScopeId scope_id,
                                 std::string name,
                                 const SymbolKind kind,
                                 const TypeKind type,
                                 const source::Location& location,
                                 const void* declaration) {
    assert(scope_id < scopes_.size());

    const SymbolId id = symbols_.size();
    symbols_.emplace_back(id, name, kind, type, location, declaration);
    symbols_.back().scope_id = scope_id;
    scopes_[scope_id].symbols[std::move(name)].push_back(id);

    return id;
}

const Symbol* SymbolTable::get_symbol(const SymbolId id) const {
    return id < symbols_.size() ? &symbols_[id] : nullptr;
}

Symbol* SymbolTable::get_symbol(const SymbolId id) { return id < symbols_.size() ? &symbols_[id] : nullptr; }

void SymbolTable::set_symbol_type(const SymbolId id, const TypeKind type) {
    if (Symbol* target = get_symbol(id)) {
        target->type = type;
    }
}

const Symbol* SymbolTable::find_in_scope(const ScopeId scope_id, const std::string& name) const {
    const Scope* current_scope = get_scope(scope_id);
    if (!current_scope) {
        return nullptr;
    }

    const auto found = current_scope->symbols.find(name);
    if (found == current_scope->symbols.end() || found->second.empty()) {
        return nullptr;
    }

    return get_symbol(found->second.back());
}

const Symbol* SymbolTable::find_in_scope(const ScopeId scope_id,
                                         const std::string& name,
                                         const std::initializer_list<SymbolKind> kinds) const {
    const Scope* current_scope = get_scope(scope_id);
    if (!current_scope) {
        return nullptr;
    }

    const auto found = current_scope->symbols.find(name);
    if (found == current_scope->symbols.end()) {
        return nullptr;
    }

    for (const SymbolId id : std::views::reverse(found->second)) {
        const Symbol* candidate = get_symbol(id);
        if (!candidate) {
            continue;
        }

        for (const SymbolKind kind : kinds) {
            if (candidate->kind == kind) {
                return candidate;
            }
        }
    }

    return nullptr;
}

namespace {

bool same_param_signature(const ast::PatternDefinition& pattern, const std::vector<TypeKind>& param_types) {
    if (pattern.params.size() != param_types.size()) {
        return false;
    }

    for (std::size_t i = 0; i < pattern.params.size(); ++i) {
        if (pattern.params[i].type != param_types[i]) {
            return false;
        }
    }

    return true;
}

std::vector<TypeKind> pattern_param_types(const ast::PatternDefinition& pattern) {
    std::vector<TypeKind> types;
    types.reserve(pattern.params.size());
    for (const auto& param : pattern.params) {
        types.push_back(param.type);
    }
    return types;
}

int overload_match_score(const ast::PatternDefinition& pattern, const std::vector<TypeKind>& argument_types) {
    if (pattern.params.size() != argument_types.size()) {
        return -1;
    }

    int score = 0;
    for (std::size_t i = 0; i < pattern.params.size(); ++i) {
        const TypeKind param_type = pattern.params[i].type;
        const TypeKind arg_type = argument_types[i];

        if (!types::is_assignable(param_type, arg_type)) {
            return -1;
        }

        if (param_type == arg_type) {
            score += 2;
        }
    }

    return score;
}

}  // namespace

const Symbol* SymbolTable::find_in_scope_by_signature(const ScopeId scope_id,
                                                      const std::string& name,
                                                      const std::vector<TypeKind>& param_types) const {
    const Scope* scope = get_scope(scope_id);
    if (!scope) {
        return nullptr;
    }

    const auto found = scope->symbols.find(name);
    if (found == scope->symbols.end()) {
        return nullptr;
    }

    for (const SymbolId id : found->second) {
        const Symbol* candidate = get_symbol(id);
        if (!candidate || candidate->kind != SymbolKind::Pattern) {
            continue;
        }

        const auto* pattern = static_cast<const ast::PatternDefinition*>(candidate->declaration);
        if (pattern && same_param_signature(*pattern, param_types)) {
            return candidate;
        }
    }

    return nullptr;
}

const Symbol* SymbolTable::find_visible_pattern_by_signature(ScopeId scope_id,
                                                             const std::string& name,
                                                             const std::vector<TypeKind>& argument_types) const {
    const Symbol* best_match = nullptr;
    int best_score = -1;

    while (const Scope* scope = get_scope(scope_id)) {
        const auto found = scope->symbols.find(name);
        if (found != scope->symbols.end()) {
            for (const SymbolId id : found->second) {
                const Symbol* candidate = get_symbol(id);
                if (!candidate || candidate->kind != SymbolKind::Pattern) {
                    continue;
                }

                const auto* pattern = static_cast<const ast::PatternDefinition*>(candidate->declaration);
                if (!pattern) {
                    continue;
                }

                const int score = overload_match_score(*pattern, argument_types);
                if (score > best_score) {
                    best_score = score;
                    best_match = candidate;
                }
            }
        }

        if (!scope->parent) {
            break;
        }

        scope_id = *scope->parent;
    }

    return best_match;
}

const Symbol* SymbolTable::find_visible(ScopeId scope_id, const std::string& name) const {
    while (const Scope* current_scope = get_scope(scope_id)) {
        if (const Symbol* found = find_in_scope(scope_id, name)) {
            return found;
        }

        if (!current_scope->parent) {
            break;
        }

        scope_id = *current_scope->parent;
    }

    return nullptr;
}

const Symbol* SymbolTable::find_visible(ScopeId scope_id,
                                        const std::string& name,
                                        const std::initializer_list<SymbolKind> kinds) const {
    while (const Scope* current_scope = get_scope(scope_id)) {
        if (const Symbol* found = find_in_scope(scope_id, name, kinds)) {
            return found;
        }

        if (!current_scope->parent) {
            break;
        }

        scope_id = *current_scope->parent;
    }

    return nullptr;
}

bool SymbolTable::is_strict_ancestor(const ScopeId ancestor, ScopeId of_scope) const {
    const Scope* scope = get_scope(of_scope);
    while (scope && scope->parent) {
        of_scope = *scope->parent;
        if (of_scope == ancestor) {
            return true;
        }
        scope = get_scope(of_scope);
    }
    return false;
}

const std::vector<Scope>& SymbolTable::scopes() const { return scopes_; }

const std::vector<Symbol>& SymbolTable::symbols() const { return symbols_; }

}  // namespace motivo::semantic::detail
