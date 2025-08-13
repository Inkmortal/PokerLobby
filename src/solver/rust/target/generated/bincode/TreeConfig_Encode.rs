impl :: bincode :: Encode for TreeConfig
{
    fn encode < __E : :: bincode :: enc :: Encoder >
    (& self, encoder : & mut __E) ->core :: result :: Result < (), :: bincode
    :: error :: EncodeError >
    {
        :: bincode :: Encode :: encode(&self.initial_state, encoder) ?; ::
        bincode :: Encode :: encode(&self.starting_pot, encoder) ?; :: bincode
        :: Encode :: encode(&self.effective_stack, encoder) ?; :: bincode ::
        Encode :: encode(&self.rake_rate, encoder) ?; :: bincode :: Encode ::
        encode(&self.rake_cap, encoder) ?; :: bincode :: Encode ::
        encode(&self.flop_bet_sizes, encoder) ?; :: bincode :: Encode ::
        encode(&self.turn_bet_sizes, encoder) ?; :: bincode :: Encode ::
        encode(&self.river_bet_sizes, encoder) ?; :: bincode :: Encode ::
        encode(&self.turn_donk_sizes, encoder) ?; :: bincode :: Encode ::
        encode(&self.river_donk_sizes, encoder) ?; :: bincode :: Encode ::
        encode(&self.add_allin_threshold, encoder) ?; :: bincode :: Encode ::
        encode(&self.force_allin_threshold, encoder) ?; :: bincode :: Encode
        :: encode(&self.merging_threshold, encoder) ?; Ok(())
    }
}